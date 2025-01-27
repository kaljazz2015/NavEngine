import { LogLine } from "../../types/log";
import { NavEngine } from "../index";
import { observe } from "../inference";
import { LLMClient } from "../llm/LLMClient";
import { NavEnginePage } from "../NavEnginePage";
import { generateId } from "../utils";
import {
  getAccessibilityTree,
  getXPathByResolvedObjectId,
} from "../a11y/utils";

export class NavEngineObserveHandler {
  private readonly NavEngine: NavEngine;
  private readonly logger: (logLine: LogLine) => void;
  private readonly NavEnginePage: NavEnginePage;
  private observations: {
    [key: string]: {
      result: { selector: string; description: string }[];
      instruction: string;
    };
  };
  private readonly userProvidedInstructions?: string;
  constructor({
    NavEngine,
    logger,
    NavEnginePage,
    userProvidedInstructions,
  }: {
    NavEngine: NavEngine;
    logger: (logLine: LogLine) => void;
    NavEnginePage: NavEnginePage;
    userProvidedInstructions?: string;
  }) {
    this.NavEngine = NavEngine;
    this.logger = logger;
    this.NavEnginePage = NavEnginePage;
    this.userProvidedInstructions = userProvidedInstructions;
    this.observations = {};
  }

  private async _recordObservation(
    instruction: string,
    result: { selector: string; description: string }[],
  ): Promise<string> {
    const id = generateId(instruction);

    this.observations[id] = { result, instruction };

    return id;
  }

  public async observe({
    instruction,
    llmClient,
    requestId,
    useAccessibilityTree = false,
  }: {
    instruction: string;
    llmClient: LLMClient;
    requestId: string;
    domSettleTimeoutMs?: number;
    useAccessibilityTree?: boolean;
  }) {
    if (!instruction) {
      instruction = `Find elements that can be used for any future actions in the page. These may be navigation links, related pages, section/subsection links, buttons, or other interactive elements. Be comprehensive: if there are multiple elements that may be relevant for future actions, return all of them.`;
    }
    this.logger({
      category: "observation",
      message: "starting observation",
      level: 1,
      auxiliary: {
        instruction: {
          value: instruction,
          type: "string",
        },
      },
    });

    let outputString: string;
    let selectorMap: Record<string, string[]> = {};
    const backendNodeIdMap: Record<string, number> = {};

    await this.NavEnginePage.startDomDebug();
    await this.NavEnginePage.enableCDP("DOM");

    const evalResult = await this.NavEngine.page.evaluate(() => {
      return window.processAllOfDom().then((result) => result);
    });

    // For each element in the selector map, get its backendNodeId
    for (const [index, xpaths] of Object.entries(evalResult.selectorMap)) {
      try {
        // Use the first xpath to find the element
        const xpath = xpaths[0];
        const { result } = await this.NavEnginePage.sendCDP<{
          result: { objectId: string };
        }>("Runtime.evaluate", {
          expression: `document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`,
          returnByValue: false,
        });

        if (result.objectId) {
          // Get the node details using CDP
          const { node } = await this.NavEnginePage.sendCDP<{
            node: { backendNodeId: number };
          }>("DOM.describeNode", {
            objectId: result.objectId,
            depth: -1,
            pierce: true,
          });

          if (node.backendNodeId) {
            backendNodeIdMap[index] = node.backendNodeId;
          }
        }
      } catch (error) {
        console.warn(
          `Failed to get backendNodeId for element ${index}:`,
          error,
        );
        continue;
      }
    }

    await this.NavEnginePage.disableCDP("DOM");
    ({ outputString, selectorMap } = evalResult);

    if (useAccessibilityTree) {
      const tree = await getAccessibilityTree(this.NavEnginePage, this.logger);

      this.logger({
        category: "observation",
        message: "Getting accessibility tree data",
        level: 1,
      });

      outputString = tree.simplified;
    }

    // No screenshot or vision-based annotation is performed
    const observationResponse = await observe({
      instruction,
      domElements: outputString,
      llmClient,
      requestId,
      userProvidedInstructions: this.userProvidedInstructions,
      logger: this.logger,
      isUsingAccessibilityTree: useAccessibilityTree,
    });
    const elementsWithSelectors = await Promise.all(
      observationResponse.elements.map(async (element) => {
        const { elementId, ...rest } = element;

        if (useAccessibilityTree) {
          const index = Object.entries(backendNodeIdMap).find(
            ([, value]) => value === elementId,
          )?.[0];
          if (!index || !selectorMap[index]?.[0]) {
            // Generate xpath for the given element if not found in selectorMap
            const { object } = await this.NavEnginePage.sendCDP<{
              object: { objectId: string };
            }>("DOM.resolveNode", {
              backendNodeId: elementId,
            });
            const xpath = await getXPathByResolvedObjectId(
              await this.NavEnginePage.getCDPClient(),
              object.objectId,
            );
            return {
              ...rest,
              selector: xpath,
              backendNodeId: elementId,
            };
          }
          return {
            ...rest,
            selector: `xpath=${selectorMap[index][0]}`,
            backendNodeId: elementId,
          };
        }

        return {
          ...rest,
          selector: `xpath=${selectorMap[elementId][0]}`,
          backendNodeId: backendNodeIdMap[elementId],
        };
      }),
    );

    await this.NavEnginePage.cleanupDomDebug();

    this.logger({
      category: "observation",
      message: "found elements",
      level: 1,
      auxiliary: {
        elements: {
          value: JSON.stringify(elementsWithSelectors),
          type: "object",
        },
      },
    });

    await this._recordObservation(instruction, elementsWithSelectors);
    return elementsWithSelectors;
  }
}
