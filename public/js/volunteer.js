async function handleVolunteerSubmission(e, positionId) {
  // Grab the hidden bot input field
  const botTrapValue = document.getElementById("website").value;

  // If there's data inside it, flag it as a spam script
  if (botTrapValue.trim().length > 0) {
    console.warn("Spam execution intercepted.");

    // Safety check: if 'e' is the form element (passed via 'this' in HTML inline action)
    if (e && typeof e.reset === "function") {
      e.reset();
    } else {
      document.querySelector("#volunteerForm").reset();
    }

    // Show a message to change the inner HTML so the bot stops attempting to submit
    document.querySelector("#volunteerForm").innerHTML =
      "<h3>Your message was delivered</h3>";

    return false;
  }

  const formElement = document.querySelector("#volunteerForm");
  const values = formElement.elements;

  console.log("VALUES: ", values);

  try {
    const response = await fetch(
      `https://fpserver.grahamwebworks.com/api/volunteer/submit/${positionId}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name.value,
          email: values.email.value,
          message: values.message.value,
        }),
      },
    );

    const result = await response.json();
    console.log("RESULT: ", result);

    formElement.innerHTML = "<h3>Your message was delivered</h3>";
  } catch (error) {
    console.error("Submission failed:", error);
    // Optional: add human error message feedback handling here if server drops
  }
}
