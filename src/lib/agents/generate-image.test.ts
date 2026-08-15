import { test } from "node:test";
import assert from "node:assert/strict";

import { isOpenAIConfigured } from "./generate-image.ts";

test("isOpenAIConfigured reflects OPENAI_API_KEY presence", () => {
  const original = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    assert.equal(isOpenAIConfigured(), false);

    process.env.OPENAI_API_KEY = "sk-test-placeholder";
    assert.equal(isOpenAIConfigured(), true);

    process.env.OPENAI_API_KEY = "";
    assert.equal(isOpenAIConfigured(), false);
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = original;
  }
});
