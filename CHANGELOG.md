# CHANGELOG

**Note:** This is a cumulative changelog that outlines all of the changes to all the packages from [packages](./packages) folder.

Versions marked with a number and date (e.g. Falcon Client v0.1.0 (2018-10-05)) are already released and available via npm. Versions without a date are not released yet.

## Falcon vNEXT

### Falcon Server vNext

- added ability to cache GQL resolvers by tags ([#421](https://github.com/deity-io/falcon/pull/421))

### Falcon Scripts v0.0.1

- initial release

### Falcon E-commerce UI Kit v0.4.1 (2019-04-11)

- feat: (Breaking change) corrected names for collections `[noun]sList` --> `[noun]List` ([#427](https://github.com/deity-io/falcon/pull/427))

---

## Falcon v1.0

### Falcon Magento2 API v0.5.0 (2019-04-11)

- fixed issue with merging guest's with customer's carts ([#394](https://github.com/deity-io/falcon/pull/394))
- fixed issue with 0 price for the first product added to cart by authorized user ([#394](https://github.com/deity-io/falcon/pull/394))

### Falcon-Server v0.2.1 (2019-04-11)

- introduced `@cache` GraphQL directive to cache resolver results ([#374](https://github.com/deity-io/falcon/pull/374))
- `url` resolver is cached now ([#374](https://github.com/deity-io/falcon/pull/374))

### Falcon Shop Extension v0.4.1 (2019-04-11)

- `menu`, `Category`, `Category.products`, `Product` and `Product.breadcrumbs` resolvers are cached now ([#374](https://github.com/deity-io/falcon/pull/374))

### Falcon Client v0.4.1 (2019-04-11)

- fixed absolute path to output directory embedded in bundle ([385](https://github.com/deity-io/falcon/issues/385))

### Falcon E-commerce UI Kit v0.4.1 (2019-04-11)

- added basic component set (queries, mutations and ui) to build filters ([#365](https://github.com/deity-io/falcon/pull/365))
- fix for not reloaded Product Thumbnails on ProductList ([#407](https://github.com/deity-io/falcon/pull/407))
- added message placeholder for empty Product List ([#408](https://github.com/deity-io/falcon/issues/408))

---

## Falcon v1.0 RC3 (2019-04-02)

### Falcon Client v0.4.0 (2019-04-02)

- changed GraphQL Proxy config in favor of passing GraphQL URL explicitly ([#355](https://github.com/deity-io/falcon/pull/355))
- changed the way of configuring PORT for `falcon-client` and `webpackDevServer` ([#364](https://github.com/deity-io/falcon/pull/364))
- fixed vulnerability of `razzle-dev-utils` > `react-dev-utils` dependency ([305](https://github.com/deity-io/falcon/issues/305))
- fixed issue where appHtmlMiddleware does not pass GoogleTagManager information to falcon-client/src/components/Html.js (even though the config is correct). ([#362](https://github.com/deity-io/falcon/pull/362))
- added `bootstrap/configureServer` script to proxy requests from Falcon-Client to Falcon-Server ([#247](https://github.com/deity-io/falcon/pull/247))
- added root client `Query.getConfig` resolver (`getConfig (key: "...") @client`) to extract config value for the specified key ([#247](https://github.com/deity-io/falcon/pull/247))

### Falcon UI v0.2.0 (2019-04-02)

- exposed `withTheme()` so theme values can be accessed from not themed components ([#371](https://github.com/deity-io/falcon/pull/371))

### Falcon Server v0.2.0 (2019-04-02)

- introduced `onRouterCreated` and `onRouterInitialized` bootstrap events ([#247](https://github.com/deity-io/falcon/pull/247))
- introduced scalar `JSON` GraphQL type available for any extension ([#247](https://github.com/deity-io/falcon/pull/247))
- exposes `/endpoints` endpoint to get a list of entries to be proxies to the external backend (service) ([#247](https://github.com/deity-io/falcon/pull/247))

### Falcon E-commerce UI Kit v0.4.0 (2019-04-02)

- `CheckoutMutation` now handles "union" result types from Falcon-Server ([#247](https://github.com/deity-io/falcon/pull/247))

### Falcon Shop Extension v0.4.0 (2019-04-02)

- `Cart.quoteCurrency` is now deprecated ([#247](https://github.com/deity-io/falcon/pull/247))
- `PaymentMethodInput` GraphQL input now accepts `additionalData` object ([#247](https://github.com/deity-io/falcon/pull/247))
- `Mutation.placeOrder` can now return 2 result types - `PlaceOrderSuccessfulResult` and `PlaceOrder3dSecureResult` ([#247](https://github.com/deity-io/falcon/pull/247))

### Falcon Magento2 API v0.4.0 (2019-04-02)

- added Adyen (credit card) and PayPal Payment Gateways support ([#247](https://github.com/deity-io/falcon/pull/247))
- updated urls of Magento REST endpoints ([#376](https://github.com/deity-io/falcon/pull/376))

### Falcon Payment Plugin v0.0.1

- initial release

### Falcon Adyen Plugin v0.0.1

- initial release

### Falcon PayPal Plugin v0.0.1

- initial release

---

## Falcon v1.0 RC2 (2019-03-13)

### Falcon Client v0.3.1 (2019-03-13)

- added `.browserslistrc` support for javascript, fixed #293 ([#306](https://github.com/deity-io/falcon/pull/306))
- added support for normal module replacement ([#328](https://github.com/deity-io/falcon/pull/328))
- HTML5 autocomplete on checkout address form ([#330](https://github.com/deity-io/falcon/pull/330))
- introduced `graphqlProxy` config flag to control GraphQL proxy via Falcon-Client route ([#337](https://github.com/deity-io/falcon/pull/337))
- added possibility to override any component with custom implementation ([#328](https://github.com/deity-io/falcon/pull/328))
- updated `ApolloClient` to the latest version with built-in local state management ([#333](https://github.com/deity-io/falcon/pull/333))
- fixed issues with handling cookies when Falcon Server runs under a different domain than Falcon Client ([#337](https://github.com/deity-io/falcon/pull/337))
- fixed issues with address autocompletion on checkout page ([#330](https://github.com/deity-io/falcon/pull/330))
- fixed configuration of loadable components ([#327](https://github.com/deity-io/falcon/pull/327))

### Normal Module Override Webpack Plugin v0.0.1 (2019-03-13)

- feat: first version of Normal Module Override Webpack Plugin ([#328](https://github.com/deity-io/falcon/pull/328))

### Falcon Magento2 API v0.3.1 (2019-03-13)

- fixed problems with fetching store configurations for logged in users when Falcon Server is restarted ([#331](https://github.com/deity-io/falcon/pull/331))

---

## Falcon v1.0 RC (2019-02-14)

### Falcon Shop Extension v0.3.0 (2019-02-14)

- updated schema to handle filters correctly ([#309](https://github.com/deity-io/falcon/pull/309))

### Falcon Magento2 API v0.3.0 (2019-02-14)

- added filters implementation ([#309](https://github.com/deity-io/falcon/pull/309))
- updated endpoint for placing order so it's compatible with falcon-magento2-module v3.0.0
- added fetching of dynamic menu ([#280](https://github.com/deity-io/falcon/pull/280))

### Falcon E-commerce UI Kit v0.3.0 (2019-02-14)

- added `SearchProvider` with `SearchContext` that handles basic filtering ([#309](https://github.com/deity-io/falcon/pull/309))
- added handling of dynamic menu ([#280](https://github.com/deity-io/falcon/pull/280))
- updated `ApolloClient` to the newest version (v2.5.1) ([#333](https://github.com/deity-io/falcon/pull/333))

### Falcon Client v0.3.0 (2019-02-14)

- fixed offline mode ([#266](https://github.com/deity-io/falcon/pull/266))

### Falcon Server v0.3.0 (2019-02-14)

- fixed missing dependencies (`core-js`) issue ([#313](https://github.com/deity-io/falcon/pull/313))

---

## Falcon v0.3 (2019-01-18)

### Falcon Client v0.2.0 (2019-01-18)

- improvement: React 16.6 support ([#226](https://github.com/deity-io/falcon/pull/226))
- added support for scss with css modules ([#259](https://github.com/deity-io/falcon/pull/259))

### Falcon Server v0.1.1 (2019-01-18)

- refactor: `Events` enum has been moved from `falcon-server` to `falcon-server-env` package ([#146](https://github.com/deity-io/falcon/pull/146))

### Falcon Magento2 API v0.2.0 (2019-01-18)

- changed url resolver to use new format of data sent by `/url` endpoint ([#146](https://github.com/deity-io/falcon/pull/146))
- added support for fetching breadcrumbs from new endpoint ([#146](https://github.com/deity-io/falcon/pull/146))
- added support for product list sorting ([#146](https://github.com/deity-io/falcon/pull/146))
- modified fetching of category products - now it uses `/categories/{id}/products` endpoint ([#146](https://github.com/deity-io/falcon/pull/146))
- added aggregations parsing for ProductList ([#146](https://github.com/deity-io/falcon/pull/146))

### Falcon UI v0.2.0 (2019-01-18)

- feat: added `Menu` component ([#240](https://github.com/deity-io/falcon/pull/240))

### Falcon E-commerce UI Kit v0.2.0 (2019-01-18)

- feat: added queries and mutations for:
  - getting all orders and by id
  - addresses operations (add new address, remove address, change address)
  - editing customer information and changing password ([#240](https://github.com/deity-io/falcon/pull/240))
- feat: added `CheckboxFormField` ([#240](https://github.com/deity-io/falcon/pull/240))
- improvement: extracted `Field` component in order to improve support for custom `FormField`'s component ([#240](https://github.com/deity-io/falcon/pull/240))
- added `SortOrderProvider` which handles fetching and setting sort options for product lists ([#146](https://github.com/deity-io/falcon/pull/146))

### Falcon Shop Extension v0.2.0 (2019-01-18)

- feat: introduced resolver `addresses: AddressList` in order to retrieve all customer addresses, added types `EditAddressInput`, `AddAddressInput` ([#240](https://github.com/deity-io/falcon/pull/240))

---

## Falcon v0.2 (2018-12-12)

### Falcon Client v0.1.0 (2018-12-12)

- feat: support for Google Analytics added ([#78](https://github.com/deity-io/falcon/pull/78))
- improvement: removed razzle ([#87](https://github.com/deity-io/falcon/pull/87))
- feat: added translations for common app areas (except checkout) ([#205](https://github.com/deity-io/falcon/pull/205))

### Falcon Server v0.1.0 (2018-12-12)

- feat: Basic Cache implementation was introduced ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: (Breaking change) changed Event flow for ApiContainer and its entries - every ApiDataSource instance is being
  created on GQL request ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: added `backendConfig` Query type ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: `type BackendConfig`, `enum SortOrderDirection`, `input SortOrderInput` were introduced in the base Schema ([#176](https://github.com/deity-io/falcon/pull/176))
- fix: added separate `endpoints` config section and dedicated base class ([#176](https://github.com/deity-io/falcon/pull/176))
- refactor: `Events` enum has been moved from `falcon-server` to `falcon-server-env` package ([#176](https://github.com/deity-io/falcon/pull/176))

### Falcon UI v0.1.0 (2018-12-12)

- docs: comprehensive documentation added ([#115](https://github.com/deity-io/falcon/pull/115))
- feat: support for keyframe animations defined in theme ([#153](https://github.com/deity-io/falcon/pull/153))

### Falcon Theme Editor v0.1.0 (2018-12-12)

- feat: inspect mode, more props, improved performance, layout tweaks ([#115](https://github.com/deity-io/falcon/pull/115))

### Falcon E-commerce UI Kit v0.1.0 (2018-12-12)

- feat: basic blog UI (listing posts, displaying single post) ([#137](https://github.com/deity-io/falcon/pull/137))
- feat: added queries and mutations for cart operations (add to cart, remove from cart, change cart item) ([#114](https://github.com/deity-io/falcon/pull/114))
- feat: added queries and mutations for sign in / sign out operations ([#152](https://github.com/deity-io/falcon/pull/152))
- feat: added `ProtectedRoute` and `OnlyUnauthenticatedRoute` route components ([#163](https://github.com/deity-io/falcon/pull/163))
- feat: added queries and mutations for checkout process and implemented checkout logic abstraction ([#182](https://github.com/deity-io/falcon/pull/182))
- feat: added `Form` component which provides translation context for `FormField`s ([#205](https://github.com/deity-io/falcon/pull/205))

### Create Falcon App v1.1.1 (2018-12-12)

- feat: allow ejecting `falcon-ecommerce-uikit` package via `eject` command ([#212](https://github.com/deity-io/falcon/pull/212))

### Create Falcon App v1.0.7 (2018-10-25)

- docs: updated documentation ([#47](https://github.com/deity-io/falcon/pull/47))
- fix: fixed problem with React 16.6.0 ([#109](https://github.com/deity-io/falcon/pull/109))

### Falcon Server Env v0.1.0 (2018-12-12)

- feat: Provided `Cache` wrapper class and built-in `InMemoryLRUCache` cache provider ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: added getter and setter methods to work with "named" session object from the context in ApiDataSource
  ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: `ApiDataSource` and `Extension` models are now accept `eventEmitter` instance
  ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: Provided `EndpointManager` base class ([#176](https://github.com/deity-io/falcon/pull/176))
- feat: Base `Extension` class provides auto-binding for its own GraphQL Schema to the assigned ApiDataSource instance
  (via `getGraphQLConfig()` method) ([#176](https://github.com/deity-io/falcon/pull/176))

### Falcon Magento2 API v0.1.0 (2018-12-12)

- feat: Magento Admin token is now being stored in cache ([#176](https://github.com/deity-io/falcon/pull/176))

### eject-ts v0.1.0 (2018-12-12)

- feat: eject-ts CLI ([#212](https://github.com/deity-io/falcon/pull/212))

### Falcon-i18n v0.0.4

- feat: added `i18nProvider` with `I18n` and `T` components to ease internationalization support ([#205](https://github.com/deity-io/falcon/pull/205))

---

## Falcon v0.1 (2018-10-05)

### Falcon Client v0.0.1 (2018-10-05)

- feat: development and build process using razzle (https://github.com/jaredpalmer/razzle)
- feat: built in SSR
- feat: built in i18n
- feat: connection with Falcon Server via [Apollo Client](https://www.apollographql.com/docs/react/)
- feat: state management via [Apollo Link State](https://www.apollographql.com/docs/link/links/state.html)

### Falcon Server v0.0.1 (2018-10-05)

- feat: extensions system with built-in schema stitching
- feat: all the communication based on GraphQL (using [Apollo Server](https://www.apollographql.com/docs/apollo-server/))

### Falcon UI v0.0.1 (2018-10-05)

- feat: basic set of components with theming capabilities
- feat: first version of theme editor as React component

### Falcon E-commerce UI Kit v0.0.1 (2018-10-05)

- feat: product list view
- feat: product page view
- feat: mini cart view on sidebar

### Create Falcon App v1.0.0 (2018-10-05)

- feat: creating Falcon project from predefined template

### Falcon Shop Extension v0.0.1 (2018-10-05)

- feat: first version of schema for shop features

### Falcon Magento2 Api v0.0.1 (2018-10-05)

- feat: resolvers for Falcon Shop Extension used for communication with Magento2 shop

### Falcon Blog Extension v0.0.1 (2018-10-05)

- feat: first version of schema for blog features

### Falcon WordPress Api v0.0.1 (2018-10-05)

- feat: resolvers for Falcon Blog Extension used for communication with WordPress backend
