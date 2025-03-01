document.addEventListener("DOMContentLoaded", function () {
  const runQueryButton = document.getElementById("run-query");

  if (runQueryButton) {
      runQueryButton.addEventListener("click", function () {
          console.log("Button clicked!!");
          alert(1);
      });
  } else {
      console.error("Button with ID 'run-query' not found!");
  }
});
