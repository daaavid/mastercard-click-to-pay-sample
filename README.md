## Description:

This is a simple application demonstrating how to use the Mastercard Click to Pay SDK.

## Prerequisites:

Create a env.js file:

```shell
touch env.js
```

Add the following code to the env.js file:

```javascript
const ENV_DPA_ID = YOUR_DPA_ID;
```

Install dependencies:

```
npm install
```

## Running the application:

```
npm run start
```

## Notes:

Any changes to the code will require a hard refresh (cmd+shift+R) of the page to see the changes.

## Returning C2P User Flow:

```mermaid
graph TD
    Y{{Go to new C2P<br>user or card flow}}
    Z{{Exit C2P flow}}

    A(Initialize C2P SDK<br><br><i>c2p.init#40;#41;#59;</i>)
    A --> B[Load cards via<br>browser cookie<br><br><i>c2p.getCards#40;#41;#59;</i>]
    B --> C[/Received cards?\]
    C --> |No| D[Check if enrolled via<br>email or phone #<br><br><i>c2p.idLookup#40;#41;#59;</i>]
    C --> |Yes| J
    D --> E[/Found user?\]
    E --> |No| Y
    E --> |Yes| F[Send One Time Password<br>#40;OTP#41; to email or phone #<br><br><i>c2p.initiateValidation#40;#41;#59;</i>]
    F --> G[User enters OTP]
    G --> H[Validate OTP<br>#40;Returns cards if valid#41;<br><br><i>c2p.validate#40;#41;#59;</i>]
    H --> I[/Valid OTP?\]
    I --> |No| V[/Prompt user to<br>re-enter OTP,<br>select other OTP method<br>#40;email or phone ##41;,<br>or pay another way\]
    V --> |Pay another way| Z
    V --> |Re-enter OTP| I
    V --> |Select other OTP method| F
    I --> |Yes| J[/Display cards\]
    J --> |User selects and<br>submits existing card| L[Record payment intent<br>using encrypted card data<br><br><i>c2p.checkoutWithCard#40;#41;#59;</i>]
    J --> |User clicks<br>#34;Use a different card#34;<br>or<br>#34;Not your cards?#34;| Y
    L --> M[Send encrypted card data<br>to your back end<br><br>ex. <b>POST</b> <i>/pay</i>]
    M --> N[[<b>Back End#58;</b><br>Decrypt card data using<br>your Mastercard credentials]]
    N --> O[[Use decrypted network<br>token to run payment]]
    O --> P[[Send payment result<br>to Mastercard<br><br><b>POST</b><br><i>/checkout/confirmations</i>]]
    P --> Q[[Return result<br>to front end]]
    Q --> R[Display payment<br>result to user]
    R --> Z
```
