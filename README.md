
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Testing the Lightspark Integration

Ensuring your Lightspark integration works correctly and complies with their guidelines is crucial before handling real funds. Here's a comprehensive approach to testing:

**1. Use Lightspark's Test Environment (Testnet/Sandbox)**

*   **Crucial First Step:** Lightspark, like most financial service providers, will almost certainly offer a **test environment** (often called Testnet, Sandbox, or Regtest). This environment allows you to make real API calls and use the SDK without involving actual Bitcoin or real money.
*   **Separate API Keys:** You'll typically need a different set of API keys (`LIGHTSPARK_API_TOKEN_CLIENT_ID`, `LIGHTSPARK_API_TOKEN_CLIENT_SECRET`) specifically for their test environment.
*   **Different Base URL:** The `LIGHTSPARK_BASE_URL` in your `.env` file might also need to be pointed to their test environment's URL.
*   **Consult Lightspark Documentation:** The Lightspark SDK documentation is your primary resource. Look for sections on "Testing," "Testnet," "Sandbox," or API environments. It will detail how to get test credentials and configure the SDK for their test environment.

**2. Configure Your Application for Testing**

*   Update your `.env` file with the test environment API keys and base URL.
*   Restart your Next.js application to ensure it picks up these new environment variables.

**3. Types of Testing**

*   **A. Manual End-to-End Testing (Most Important for Functionality):**
    *   Once configured for the test environment, use your SparkChat web interface to perform all available actions:
        *   **Check Balances:** Verify that the balances displayed match what you expect in your Lightspark test wallet.
        *   **View Transaction History:** Ensure transactions you perform in the test environment appear correctly.
        *   **Deposit BTC:**
            *   Your app should generate a Lightspark invoice (on the testnet).
            *   Use a testnet Bitcoin/Lightning wallet (many are available, or Lightspark might provide tools) to "pay" this invoice.
            *   Verify the BTC balance in SparkChat updates and the transaction appears in the history.
        *   **Withdraw USD (or BTC if direct BTC withdrawal is implemented):**
            *   This is highly dependent on how Lightspark handles withdrawals (e.g., to another Lightning invoice, a bank account via a partner, or a Bitcoin address).
            *   If withdrawing to a Lightning invoice, generate one from a testnet wallet and use it in SparkChat.
            *   Verify the USD balance decreases and the transaction is recorded.
        *   **Convert BTC to USD / USD to BTC:** Perform conversions and check if both balances update correctly and the transaction appears.
    *   **Check Lightspark Dashboard:** If Lightspark provides a web dashboard for their test environment, log in to it to see if the operations performed through your app are reflected correctly there. This is excellent for cross-verification.

*   **B. Integration Testing (Automated API Calls):**
    *   Write automated tests (e.g., using Jest or Vitest) that call your server actions in `src/app/actions.ts`.
    *   These tests will indirectly call your `src/services/lightspark.ts` functions, which in turn will make **real API calls to the Lightspark test environment**.
    *   This helps ensure your service layer correctly interacts with the live (test) SDK.
    *   **Example Test Case:**
        *   An integration test for `depositBTCAction` might:
            1.  Call the action.
            2.  Assert that the `invoice` field in the response is a valid-looking testnet Lightning invoice.
            3.  (Optionally, if you have tools) Programmatically pay the invoice on the testnet.
            4.  Call `fetchBalancesAction` and assert the BTC balance has increased.
            5.  Call `fetchTransactionsAction` and assert the deposit transaction is present.

*   **C. Unit Testing (Mocking the SDK):**
    *   For functions in `src/services/lightspark.ts`, you can write unit tests where you **mock the `LightsparkClient` and its methods**.
    *   This allows you to:
        *   Verify that your service functions call the correct SDK methods with the expected parameters (e.g., correct `walletId`, amounts, memo).
        *   Test how your code handles different SDK responses (success, errors).
        *   Test your data mapping logic (e.g., converting SDK transaction objects to your app's `Transaction` type).
    *   This doesn't test the live integration but ensures your wrapper logic around the SDK is sound.

**4. Verifying Compliance with Lightspark Guidelines**

*   **Thoroughly Read Documentation:** This is paramount. Pay close attention to:
    *   **Authentication:** Ensure you're initializing and using the `LightsparkClient` and `AccountTokenAuthProvider` (or any other auth mechanism) exactly as documented.
    *   **Error Handling:** Lightspark's API will return specific error codes and messages. Your code in `src/services/lightspark.ts` must catch these errors and handle them gracefully (e.g., by re-throwing a user-friendly error, logging details). Test scenarios that *should* produce errors (e.g., insufficient funds for a mock withdrawal, invalid parameters).
    *   **Rate Limits:** Be aware of any API rate limits and ensure your application doesn't exceed them.
    *   **Idempotency:** Understand if and how Lightspark supports idempotent requests (e.g., for creating payments) to prevent accidental duplicate operations.
    *   **Transaction Finality & Statuses:** Correctly interpret transaction statuses returned by the SDK (e.g., `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`) and reflect them accurately in your UI. A transaction isn't complete until the SDK confirms it.
    *   **Data Formatting:** Ensure amounts, currencies, and other data are formatted as expected by the SDK.
    *   **Security:**
        *   **Never expose API secrets** (`LIGHTSPARK_API_TOKEN_CLIENT_SECRET`) on the client-side. All Lightspark SDK calls must be made from your server-side code (which Server Actions help enforce).
        *   Validate all inputs from the user before passing them to the SDK.

**5. Logging**

*   Implement robust logging in `src/services/lightspark.ts` for requests made to the Lightspark API and the responses received. This will be invaluable for debugging during testing and in production.
    ```typescript
    // Example in src/services/lightspark.ts
    try {
      console.log(`LIGHTSPARK SERVICE: Calling client.createInvoice with walletId: ${userWalletId}, amount: ${amountMsats}`);
      const invoiceData = await client.createInvoice(userWalletId, amountMsats, memo);
      console.log('LIGHTSPARK SERVICE: createInvoice response:', invoiceData);
      // ...
    } catch (error) {
      console.error('LIGHTSPARK SERVICE: Error in createInvoice:', error);
      // Potentially log more details from the error object if it's an SDK-specific error
      throw error;
    }
    ```
