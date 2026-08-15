# DataDock Backend Architecture Notes

> MVC, the service layer, and temporary development identity using Express and the native MongoDB driver.

## 1. How one request travels

When the frontend asks the backend to perform an operation, the request passes through several layers:

```text
Frontend
  -> Express application
  -> Middleware
  -> Route
  -> Controller
  -> Service
  -> Model
  -> MongoDB
```

The result returns in the opposite direction:

```text
MongoDB
  -> Model
  -> Service
  -> Controller
  -> Frontend
```

Each layer has one main responsibility. Separating responsibilities keeps the code easier to understand, test, reuse, and change.

---

## 2. Routes

Location:

```text
src/routes/
```

Routes decide which controller should handle an HTTP request.

A route examines:

1. The HTTP method, such as `GET`, `POST`, `PATCH`, or `DELETE`.
2. The requested URL.

Examples:

```text
GET    /api/v1/items
POST   /api/v1/items/folders
PATCH  /api/v1/items/:itemId
DELETE /api/v1/items/:itemId
```

Conceptually, routes perform mappings like these:

```text
GET /items          -> list-items controller
POST /items/folders -> create-folder controller
PATCH /items/:id    -> rename-item controller
```

### Analogy

A route is like a receptionist. It determines what the visitor needs and sends them to the correct person.

### A route should not

- Query MongoDB directly.
- Contain business rules.
- Calculate storage usage.
- Hash passwords.
- Upload files.
- Construct complicated responses.

### Why routes have separate files

DataDock will eventually have routes for:

- Items
- Uploads
- Shares
- Authentication
- Users
- Billing
- Storage
- Search

Putting all these routes in `app.js` would make it large and difficult to maintain. Instead, routes should be grouped by feature:

```text
item.routes.js
auth.routes.js
share.routes.js
upload.routes.js
billing.routes.js
```

A central `routes/index.js` can combine the feature routers under a common API prefix such as `/api/v1`.

---

## 3. Controllers

Location:

```text
src/controllers/
```

A controller handles the HTTP-specific portion of a request.

It can read information from:

- `req.params` - values contained in the URL path.
- `req.query` - query-string values.
- `req.body` - submitted JSON data.
- `req.user` - the current user identity added by middleware.

A controller usually:

1. Reads HTTP input.
2. Calls the appropriate service.
3. Selects an HTTP status code.
4. Sends a JSON response.
5. Passes failures to centralized error handling.

### Analogy

A controller is a translator between HTTP and the application.

### Keep controllers thin

A controller should follow this pattern:

```text
Read HTTP input
  -> call service
  -> send HTTP output
```

Detailed MongoDB queries should not live inside controllers. Keeping queries out of controllers makes the underlying operation reusable from scheduled tasks, maintenance scripts, tests, and other services.

---

## 4. Services

Location:

```text
src/services/
```

Services contain DataDock's business logic.

Business logic means rules that belong to the product rather than to Express or MongoDB.

Examples include:

- A user cannot exceed their storage quota.
- A folder cannot be moved into itself.
- A folder cannot be moved into one of its descendants.
- Duplicate names may be forbidden in the same folder.
- Trashed items cannot be shared.
- Permanently deleting a folder must also handle its descendants.
- Copying a file may require copying its S3 object.
- Upload limits depend on the user's subscription plan.
- Share links may have passwords and expiration dates.

A service can coordinate several models and external integrations to complete one operation.

For example, permanently deleting a folder may require the service to:

1. Find the folder.
2. Confirm the user owns it.
3. Find all descendants.
4. Delete corresponding S3 objects.
5. Remove MongoDB metadata.
6. Update storage totals.
7. Record an activity event.

### Key distinction

```text
Service: What must happen?
Model:   How is it stored or retrieved?
```

---

## 5. Models

Location:

```text
src/models/
```

DataDock uses the native MongoDB Node.js driver. Therefore, a model is a database-access module; it does not need to be a Mongoose schema.

A model can know:

- The collection name.
- How to find a document.
- How to list documents.
- How to insert a folder.
- How to update an item.
- How to find folder descendants.
- How to construct MongoDB filters.
- Which fields to return through projections.
- How sorting and pagination work.
- Which indexes the collection requires.

A model should receive normal values such as:

```text
ownerId
parentId
itemId
name
limit
sort
cursor
```

A model should not receive:

- Express `req`.
- Express `res`.
- HTTP status codes.
- Browser cookies.
- Postman or Thunder Client request objects.

### Models without Mongoose

MVC does not require Mongoose. A native-driver model can use the existing `getDatabase()` function and work directly with MongoDB collections.

For example, a future user model will conceptually support:

- Find a user by email.
- Find a user by ID.
- Create a user.
- Mark an email as verified.
- Update password information.

A future item model will conceptually support:

- List folder contents.
- Find an item.
- Create folders.
- Rename items.
- Move items.
- Star items.
- Trash and restore items.
- Search items.

---

## 6. Middleware

Location:

```text
src/middleware/
```

Middleware runs as part of the request pipeline, usually before the controller.

```text
Request
  -> Middleware 1
  -> Middleware 2
  -> Controller
```

A middleware function can:

1. Inspect the request.
2. Add information to the request.
3. Reject the request.
4. Pass control to the next function.

### Application middleware

Shared across many or all routes:

- CORS
- JSON parsing
- Request logging

### Authentication middleware

Answers:

> Who are you?

It verifies a session, token, or cookie and attaches the authenticated identity to the request.

### Authorization middleware

Answers:

> Are you allowed to perform this operation?

Authentication establishes identity. Authorization establishes permission.

### Validation middleware

Checks request bodies, URL parameters, and query parameters before business logic runs.

### Error middleware

Receives errors from the application and converts them into consistent JSON responses.

---

## 7. Validators

Location:

```text
src/validators/
```

Validators define what acceptable external input looks like.

Creating a folder may require these checks:

- `name` exists.
- `name` is a string.
- `name` is not empty after trimming.
- `name` does not exceed the maximum length.
- `parentId` is a valid identifier or `null`.
- Unknown fields are rejected or ignored deliberately.

### Input validation versus business validation

Input validation can usually run without MongoDB:

```text
Is name a non-empty string?
```

Business validation may require application or database knowledge:

```text
Does another item already use this name in this folder?
```

The first belongs to validation. The second belongs to service/model collaboration.

---

## 8. Config

Location:

```text
src/config/
```

Configuration modules prepare infrastructure used by the application.

The existing `src/config/db.js` is responsible for:

- Reading the MongoDB URI.
- Reading the database name.
- Creating one reusable `MongoClient`.
- Connecting to MongoDB.
- Pinging MongoDB.
- Selecting the database.
- Providing database access.
- Closing the connection.

Future configuration modules may prepare:

- AWS S3
- Redis
- Email provider
- Razorpay
- Environment configuration

Config modules should not contain controllers or feature-specific business rules.

---

## 9. Errors

Location:

```text
src/errors/
```

Custom application errors help the system distinguish different failure categories:

- Item not found
- Duplicate name
- Invalid input
- Unauthenticated request
- Forbidden operation
- Storage quota exceeded
- Upload rejected

A structured application error can conceptually carry:

```text
message
error code
HTTP status
details
```

Centralized error middleware converts the structured error into a consistent JSON response. Code should not depend on parsing human-readable error-message text.

---

## 10. Utils

Location:

```text
src/utils/
```

Utilities are small, generic helpers that do not belong to one business feature.

Examples may include:

- Creating identifiers
- Normalizing filenames
- Building pagination cursors
- Performing safe comparisons

### Warning

The `utils` folder must not become a dumping ground.

A utility should normally be:

- Small
- Reusable
- Independent of Express
- Independent of one model
- Not a major business workflow

---

## 11. `src/app.js` versus `server.js`

### `src/app.js`

Creates and configures the Express application.

It should register:

- CORS
- JSON parsing
- API routes
- Not-found handling
- Error handling

It should not:

- Connect to MongoDB
- Start the network server
- Call `listen()`

### `server.js`

Launches the application.

It should:

1. Connect to MongoDB.
2. Start the HTTP server.
3. Handle startup failure.
4. Handle graceful shutdown later.

It should not define business routes.

---

## 12. Why `development-user.middleware.js` exists

The DataDock file system cannot be designed safely without ownership.

Every protected resource must belong to somebody:

```text
File         -> ownerId
Folder       -> ownerId
Share        -> ownerId
Subscription -> userId
```

### Unsafe query concept

```text
Find every item whose parentId is null.
```

This could return root items belonging to every user.

### Safe query concept

```text
Find items where:
ownerId equals the current user
and parentId is null
```

Every protected item query must be scoped by the current owner.

### The temporary problem

Authentication will be implemented later. Current requests do not yet contain:

- A valid login session
- An authentication cookie
- A verified token
- A real `req.user`

However, the file-system architecture should include ownership from its first implementation.

### The temporary solution

The development-user middleware temporarily attaches a configured development identity to the request:

```text
Request arrives
  -> development-user middleware
  -> request receives user.id
  -> controller reads the ID
  -> service receives ownerId
  -> model filters its query by ownerId
```

Later, real authentication middleware will perform this flow:

```text
Request arrives with authentication
  -> authentication middleware verifies it
  -> request receives the real user.id
  -> controller reads the same ID
  -> service and model remain unchanged
```

Both middleware implementations provide the same downstream value:

```text
req.user.id
```

Only the source of that identity changes.

---

## 13. Why not read `DEV_OWNER_ID` everywhere?

Reading the environment value in controllers, services, and models would cause several problems:

- Business code becomes tied to development mode.
- Tests cannot easily substitute different users.
- One forgotten ownership filter could expose another user's data.
- Authentication later would require changes across many files.
- Production could accidentally continue using the development identity.

Using one middleware creates one replacement point:

```text
One middleware chooses the request identity
  -> later layers receive ownerId explicitly
```

---

## 14. Security warning

> `development-user.middleware.js` is not real authentication or authorization.

Before production:

- Remove it from protected routes.
- Replace it with real authentication middleware.
- Reject protected requests without a valid authenticated user.
- Never trust an owner ID supplied directly by the browser.

The development middleware is only a temporary bridge that lets file-system development maintain the correct ownership architecture before authentication is ready.

---

## 15. Complete file-listing example

For this request:

```text
GET /api/v1/items
```

Each layer has a distinct responsibility.

### Middleware

Determines the temporary current user and attaches the identity to the request.

### Route

Matches `GET /api/v1/items` and chooses the list-items controller.

### Controller

Reads the current user and supported query parameters, calls the service, and returns an HTTP response.

### Service

Applies listing rules and acceptable options.

### Model

Queries the `items` collection using `ownerId` and other filters.

### MongoDB

Returns only documents belonging to the selected owner and matching the requested view.

---

## 16. Quick-reference table

| Layer | Main question | Knows about | Must not do |
|---|---|---|---|
| Route | Which handler owns this HTTP method and URL? | HTTP method, URL, middleware order, controller | Query MongoDB or contain business rules |
| Middleware | What shared work must happen before/after the handler? | Request pipeline, identity, validation, errors | Contain feature workflows unnecessarily |
| Controller | How does HTTP map to the application operation? | `req`, `res`, status codes, response JSON | Contain detailed queries or major business logic |
| Validator | Is external input structurally acceptable? | Allowed fields, types, limits, formats | Decide database-dependent business rules |
| Service | What must happen to complete this use case? | Product rules, workflows, models, integrations | Depend directly on Express `req` and `res` |
| Model | How is data stored or retrieved? | MongoDB collections, filters, projections, indexes | Decide HTTP status codes or read browser input |
| Config | How is infrastructure prepared? | MongoDB, S3, Redis, email, payment configuration | Contain feature controllers or business rules |
| Error middleware | How should a failure become an HTTP response? | Error types, status codes, safe error output | Implement the original business operation |
| Utils | What small generic helper is shared? | Pure, reusable helper behavior | Become a dumping ground for business workflows |

---

## 17. Rules to remember

- Give each layer one primary responsibility.
- Keep controllers thin.
- Put business rules in services.
- Keep MongoDB access inside models.
- Scope every protected item query by `ownerId`.
- Validate all external input.
- Never pass Express `req` or `res` into models.
- Do not hardcode development identity across multiple layers.
- Files and folders can share one `items` collection.
- Replace temporary development identity with real authentication before production.
- Store file metadata in MongoDB.
- Store file bytes in object storage such as S3.
- Reuse one MongoDB connection pool rather than reconnecting per request.
- Return only the fields and number of records the client needs.

## Final request flow

```text
Request
  -> Shared middleware
  -> Feature middleware
  -> Validator
  -> Controller
  -> Service
  -> Model
  -> MongoDB
  -> Response
```

The purpose of this structure is not to create more files. Its purpose is to make every responsibility easy to locate, understand, test, and replace without breaking unrelated parts of DataDock.
