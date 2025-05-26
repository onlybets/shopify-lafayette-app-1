import { verifyBilling } from "../app/middleware/verifyBilling";
import { createRequest } from "./test-utils";

describe("verifyBilling middleware", () => {
  it("throws 400 if shop param is missing", async () => {
    const request = createRequest("http://localhost/app");
    await expect(verifyBilling({ request })).rejects.toThrow("Missing shop parameter");
  });

  // Add more tests for active/inactive subscriptions as needed
});
