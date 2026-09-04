import {
  FixSuggestionError,
  generateFixSuggestions,
  type FixSuggestionInput,
} from "@/lib/ai";
import { auth } from "@/lib/auth";

const MAX_INPUT_LENGTHS = {
  problem: 10_000,
  errorMessage: 10_000,
  existingSolution: 20_000,
} as const;

function readOptionalText(
  body: Record<string, unknown>,
  field: keyof FixSuggestionInput,
): string | undefined {
  const value = body[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${field} must be text`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.length > MAX_INPUT_LENGTHS[field]) {
    throw new Error(`${field} is too long`);
  }

  return trimmedValue;
}

export async function POST(request: Request) {
  let session;

  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Unable to verify AI suggestion session:", error);

    return Response.json({ error: "Unable to verify session" }, { status: 500 });
  }

  if (!session?.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    const json = await request.json();

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new Error("Invalid JSON body");
    }

    body = json as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  let input: FixSuggestionInput;

  try {
    input = {
      problem: readOptionalText(body, "problem"),
      errorMessage: readOptionalText(body, "errorMessage"),
      existingSolution: readOptionalText(body, "existingSolution"),
    };
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid request input" },
      { status: 400 },
    );
  }

  if (!input.problem && !input.errorMessage && !input.existingSolution) {
    return Response.json(
      { error: "Provide a problem, error message, or existing solution." },
      { status: 400 },
    );
  }

  try {
    const result = await generateFixSuggestions(input);

    return Response.json(result, { status: result.configured ? 200 : 503 });
  } catch (error) {
    if (error instanceof FixSuggestionError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("Unable to generate AI fix suggestions:", error);

    return Response.json(
      { error: "AI suggestions are temporarily unavailable." },
      { status: 500 },
    );
  }
}
