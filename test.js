let click2payInstance;

async function init() {
  try {
    click2payInstance = new Click2Pay();
    const initResponse = await click2payInstance.init({
      srcDpaId: ENV_DPA_ID, // required
      dpaData: {
        dpaName: "Test", // required
        // dpaPresentationName: "Test", // optional
      },
      dpaTransactionOptions: {
        dpaLocale: "en_US", // required
        // paymentOptions: [{ dynamicDataType: "NONE" }], // optional
        // transactionAmount: { transactionAmount: 100, transactionCurrencyCode: "USD" }, // optional
        // consumerEmailAddressRequested: true, // optional
        // consumerPhoneNumberRequested: true, // optional
        // dpaBillingPreference: "POSTAL_COUNTRY", // optional
        // dpaLocale: "en_US", // optional
        // confirmPayment: false, // optional
        // paymentOptions: [{ dynamicDataType: "NONE" }], // optional
      },
      cardBrands: ["mastercard", "visa", "amex", "discover"], // required
      checkoutExperience: "WITHIN_CHECKOUT", // optional
    });
    console.log({ initResponse });

    const contactForm = document.getElementById("contact_details");
    contactForm.style.display = "none";
    const shippingDetails = document.getElementById("shipping_details");
    shippingDetails.style.display = "none";

    const cardsResult = await click2payInstance.getCards();
    console.log({ cardsResult });
    if (cardsResult.length) {
      displayCardList(cardsResult)
    } else {
      contactForm.style.display = "block";
      shippingDetails.style.display = "block";
    }
  } catch (error) {
    console.log(error);
  }
}

function redirectFromLocalhost() {
  if (window.location.href.includes("localhost")) {
    const message = `This application must be run on 127.0.0.1 and cannot be run on localhost due to the Click to Pay SDK's security policy. Click "OK" to be redirected to 127.0.0.1.`;
    if (window.confirm(message)) {
      console.log("got here");
      window.location.href = window.location.href.replace(
        "localhost",
        "127.0.0.1"
      );
    }
  }
}

const emailField = document.getElementById("email");
emailField.addEventListener("input", debounce(onEmailFieldInput, 500));

// Look up user by email
async function onEmailFieldInput(e) {
  try {
    const email = e.target.value;

    // If email is empty, don't proceed
    if (!email) {
      return;
    }

    const r = await click2payInstance.idLookup({ email });

    const click2payUserExists = r.consumerPresent;
    console.log(
      click2payUserExists
        ? `Click to Pay user for ${email} exists`
        : `Click to Pay user for ${email} does not exist`
    );

    const shippingDetailsSection = document.getElementById("shipping_details");
    const cardDetailsSection = document.getElementById("card_details");
     // Retrieve and display existing cards
     const cardsResult = await click2payInstance.getCards();
     console.log({ cardsResult });

    if (click2payUserExists && cardsResult.length) {
        // Hide shipping details if user exists
        shippingDetailsSection.style.display = "none";
        cardDetailsSection.style.display = "block"; // Show card details section
  
  
        // Display the card list to the user
        displayCardList(cardsResult); // Implement this function as needed
    } else {
      // Show shipping details if user does not exist
      shippingDetailsSection.style.display = "block";
      cardDetailsSection.style.display = "none";
    }
  } catch (error) {
    console.log(error);
  }
}

function displayCardList(cardsResult) {
  const cardDetailsSection = document.getElementById("card_details");

  // Clear any existing card details
  cardDetailsSection.innerHTML = "";

  if (cardsResult.length === 0) {
    // Handle case when there are no cards
    cardDetailsSection.innerHTML = "<p>No cards available.</p>";
    return;
  }

  // Assuming the cardsResult is an array with card objects
  cardsResult.forEach(card => {
    // Create card detail elements
    const cardNumberInput = document.createElement("input");
    cardNumberInput.type = "text";
    cardNumberInput.id = "card_number";
    cardNumberInput.name = "card_number";
    cardNumberInput.value = `**** **** **** ${card.panLastFour}`;
    cardNumberInput.disabled = true; // Make it read-only
    cardNumberInput.className = "card-input";

    const cardCvvInput = document.createElement("input");
    cardCvvInput.type = "text";
    cardCvvInput.id = "card_cvv";
    cardCvvInput.name = "card_cvv";
    cardCvvInput.value = "###"; // Cvv cannot be prefilled for security reasons
    cardCvvInput.disabled = true; // Make it read-only
    cardCvvInput.className = "card-input";

    const cardExpMonthInput = document.createElement("input");
    cardExpMonthInput.type = "text";
    cardExpMonthInput.id = "card_exp_month";
    cardExpMonthInput.name = "card_exp_month";
    cardExpMonthInput.value = card.panExpirationMonth;
    cardExpMonthInput.disabled = true; // Make it read-only
    cardExpMonthInput.className = "card-input";

    const cardExpYearInput = document.createElement("input");
    cardExpYearInput.type = "text";
    cardExpYearInput.id = "card_exp_year";
    cardExpYearInput.name = "card_exp_year";
    cardExpYearInput.value = card.panExpirationYear;
    cardExpYearInput.disabled = true; // Make it read-only
    cardExpYearInput.className = "card-input";

    // Append card details to the section
    cardDetailsSection.appendChild(createCardDetailElement("Card Number", cardNumberInput));
    cardDetailsSection.appendChild(createCardDetailElement("Card CVV", cardCvvInput));
    cardDetailsSection.appendChild(createCardDetailElement("Expiration Month", cardExpMonthInput));
    cardDetailsSection.appendChild(createCardDetailElement("Expiration Year", cardExpYearInput));
  });
}

// Helper function to create a labeled card detail element
function createCardDetailElement(labelText, inputElement) {
  const container = document.createElement("p");
  const label = document.createElement("label");
  label.textContent = labelText;
  label.setAttribute("for", inputElement.id);
  container.appendChild(label);
  container.appendChild(inputElement);
  return container;
}

const form = document.getElementById("form");
form.addEventListener("submit", onFormSubmit);

async function onFormSubmit(e) {
  e.preventDefault();

  /////////////////////////////////////
  // First, encrypt the card details //
  /////////////////////////////////////

  // Request
  // encryptCard({
  //   required String primaryAccountNumber;
  //   required String panExpirationMonth;
  //   required String panExpirationYear;
  //   required String cardSecurityCode;
  //   optional String cardholderFirstName;
  //   optional String cardholderLastName;
  //   optional String billingAddress: {
  //       optional String name;
  //       optional String line1;
  //       optional String line2;
  //       optional String line3;
  //       optional String city;
  //       optional String state;
  //       optional String zip;
  //       optional String countryCode;
  //     }
  //  })

  // Response
  // {
  //   required String <JWE> encryptedCard;
  //   required String cardBrand;
  // }

  try {
    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData.entries());
    const encryptCardPayload = {
      primaryAccountNumber: formValues.card_number,
      panExpirationMonth: formValues.card_exp_month,
      panExpirationYear: formValues.card_exp_year.slice(-2),
      cardSecurityCode: formValues.card_cvv,
      cardholderFirstName: formValues.first_name,
      cardholderLastName: formValues.last_name,
      billingAddress: {
        name: `${formValues.first_name} ${formValues.last_name}`,
        line1: formValues.address_line_1,
        line2: formValues.address_line_2,
        city: formValues.address_city,
        state: formValues.address_state,
        zip: formValues.address_zip,
        countryCode: formValues.address_country,
      },
    };

    const encryptedCardResult = await click2payInstance.encryptCard(
      encryptCardPayload
    );
    const encryptedCard = encryptedCardResult.encryptedCard;
    const cardBrand = encryptedCardResult.cardBrand;

    console.log({ encryptedCard, cardBrand });

    ///////////////////////////////////////////////
    // Next, use the encrypted card to check out //
    ///////////////////////////////////////////////

    // Request
    // checkoutWithNewCard ({
    //    required String <JWE> encryptedCard;
    //    required String cardBrand;
    //    optional Consumer consumer;
    //    required Object windowRef;
    //    optional Object complianceSettings;
    //    optional DpaTransactionOptions dpaTransactionOptions : {
    //     optional AuthenticationPreferences authenticationPreferences;
    //     optional TransactionAmount transactionAmount;
    //     optional String dpaBillingPreference;
    //     optional Array<String> dpaAcceptedBillingCountries;
    //     optional Boolean consumerEmailAddressRequested;
    //     optional Boolean consumerPhoneNumberRequested;
    //     optional String merchantCategoryCode;
    //     optional String merchantCountryCode;
    //     optional String <UUID> merchantOrderId;
    //     optional String threeDsPreference;
    //     optional Array<PaymentOptions> paymentOptions;
    //     required String dpaLocale;
    //     optional String orderType;
    //     optional Boolean confirmPayment;
    //   };
    //   optional Boolean rememberMe;
    // })

    // Response
    // {
    //    required String checkoutActionCode;
    //    conditional String <JWS> checkoutResponse;
    //    conditional String <JWT> idToken;
    //    conditional String network;
    //    conditional Object headers {
    //      conditional String x-src-cx-flow-id;
    //      conditional String merchant-transaction-id;
    //    }
    // }

    const modal = document.getElementById("modal");
    modal.classList.add("open");

    /**
     * You can either use an iframe or a new window to display the Click to Pay iframe.
     * This application is using an iframe inside of a modal.
     *
     * To use a new window, you can do something like this:
     * ```
     * const srcWindow = window.open("", "_blank", "popup");
     * srcWindow.moveTo(500, 100);
     * srcWindow.resizeTo(550, 650);
     *
     * checkoutWithNewCard({
     *   [...]
     *   windowRef: srcWindow,
     * });
     * ```
     */

    const checkoutWithNewCardResult =
      await click2payInstance.checkoutWithNewCard({
        encryptedCard,
        cardBrand,
        windowRef: document.getElementById("c2p-modal").contentWindow,
        // windowRef: document.querySelector("#c2p-modal").contentWindow,
        dpaTransactionOptions: {
          dpaLocale: "en_US",
        },
      });

    const checkoutActionCode = checkoutWithNewCardResult.checkoutActionCode;
    const checkoutResponse = checkoutWithNewCardResult.checkoutResponse;
    const idToken = checkoutWithNewCardResult.idToken;
    const network = checkoutWithNewCardResult.network;
    const headers = checkoutWithNewCardResult.headers;

    console.log({
      checkoutActionCode,
      checkoutResponse,
      idToken,
      network,
      headers,
    });
  } catch (error) {
    console.log(error);
  }
}

// Simulate email field value change for testing
setTimeout(() => {
  // has click to pay user
  // emailField.value = "test@test.com";

  // does not have click to pay user (probably)
  // emailField.value = `test+${crypto.randomUUID().slice(0, 8)}@test.com`;

  const event = new Event("input", { bubbles: true });
  emailField.dispatchEvent(event);
}, 1000);

redirectFromLocalhost();
init();