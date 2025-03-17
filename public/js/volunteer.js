async function handleVolunteerSubmission(e, positionId) {
  const values = document.querySelector("#volunteerForm").elements;

  console.log("VALUES: ", values);

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
    }
  );

  const result = await response.json();

  console.log("RESULT: ", result);

  document.querySelector("#volunteerForm").innerHTML =
    "<h3>Your message was delivered</h3>";
}
