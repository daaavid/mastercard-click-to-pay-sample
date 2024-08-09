const modal = document.getElementById("modal");
modal.addEventListener("click", function (e) {
  if (e.target === modal) {
    modal.classList.remove("open");
  }
});
