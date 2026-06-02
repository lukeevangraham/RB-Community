async function handleVolunteerSubmission(e, positionId) {
  // 1. Grab the hidden bot input field safely
  const botTrap = document.getElementById("website");
  const botTrapValue = botTrap ? botTrap.value : "";

  // If there's data inside it, flag it as a spam script
  if (botTrapValue.trim().length > 0) {
    console.warn("Spam execution intercepted.");

    if (e && typeof e.reset === "function") {
      e.reset();
    } else {
      document.querySelector("#volunteerForm").reset();
    }

    document.querySelector("#volunteerForm").innerHTML =
      "<h3>Your message was delivered</h3>";
    return false;
  }

  const formElement = document.querySelector("#volunteerForm");
  const values = formElement.elements;

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

    // Replace inner HTML safely
    formElement.innerHTML = "<h3>Your message was delivered</h3>";
  } catch (error) {
    console.error("Submission failed:", error);
    alert("There was an error delivering your message. Please try again.");
  }
}
