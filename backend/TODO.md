# TODO: Fix /api/chat 500 Error

Status: Planning complete, implementing fixes.

## Steps:
1. [x] Create this TODO.md
2. [ ] Edit backend/controllers/chatController.js - Add safe import/dynamic parseIntent, full debug logs (req.body, req.user, intent), safe destructuring for intent.parameters, prevent all crashes with fallbacks, simple switch replies.
3. [ ] Verify backend/routes/chat.js - Add entry log.
4. [ ] Verify backend/server.js - No change needed.
5. [ ] Test the endpoint.
6. [ ] Mark complete, attempt_completion with full corrected code snippets.

Current issue: 500 likely from undefined parseIntent (service import issue/circular), or ollama fail in parser. Controller made crash-proof.
