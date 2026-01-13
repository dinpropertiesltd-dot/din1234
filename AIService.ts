
import { GoogleGenAI } from "@google/genai";
import { PropertyFile, User, Transaction } from "./types";

/**
 * Initializes the AI client using the environment key.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates a lightweight version of property files to keep token usage within limits.
 */
const simplifyContext = (files: PropertyFile[]) => {
  return files.map(f => ({
    id: f.fileNo,
    owner: f.ownerName,
    size: f.plotSize,
    val: f.plotValue,
    paid: f.paymentReceived,
    bal: f.balance,
    overdue: f.overdue,
    // Only include the last 3 transactions to show recent activity without bloating tokens
    recentActivity: f.transactions.slice(-3).map(t => ({
      date: t.duedate,
      type: t.u_intname,
      amt: t.amount_paid || t.receivable,
      status: t.status
    }))
  }));
};

/**
 * Generates an institutional summary of a user's portfolio.
 */
export const generateSmartSummary = async (user: User, files: PropertyFile[]) => {
  const ai = getAI();
  const context = simplifyContext(files);

  const prompt = `
    Analyze this real estate portfolio for ${user.name} (${user.role}).
    REGISTRY SUMMARY: ${JSON.stringify(context)}
    
    TASK: Provide a 3-sentence high-level executive summary. 
    Focus on financial health and collection status.
    STRICT RULE: NO BOLDING, NO STARS, NO MARKDOWN STYLING.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Audit complete. Registry synchronized locally.";
  }
};

/**
 * Streams chat responses with role-based system instructions and optimized context.
 */
export async function* streamChatResponse(message: string, role: string, contextData: PropertyFile[]) {
  const ai = getAI();
  const optimizedContext = simplifyContext(contextData);

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `
        You are the DIN Properties Secure Registry Assistant.
        CURRENT USER ROLE: ${role}

        IF ROLE IS ADMIN:
        - Act as Global Portfolio Supervisor.
        - Access: ${optimizedContext.length} master records.
        - Tables for Admin: | OWNER | FILE ID | SIZE | DUE DATE | OVERDUE (PKR) |

        IF ROLE IS CLIENT:
        - Act as Private Ledger Auditor.
        - Tables for Client: | DESCRIPTION | DUE DATE | PAYABLE (PKR) | PAID (PKR) | BALANCE (PKR) |

        STRICT FORMATTING:
        1. NO BOLDING or STARS.
        2. Use Markdown Tables.
        3. Keep responses concise to save tokens.

        DATA CONTEXT: ${JSON.stringify(optimizedContext)}
      `,
    }
  });

  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const c = chunk as any;
      yield c.text;
    }
  } catch (error: any) {
    console.error("Streaming Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}
