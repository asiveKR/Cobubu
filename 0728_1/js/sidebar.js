function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const btn = document.getElementById("sidebar-toggle");
  const body = document.body;

  sidebar.classList.toggle("open");
  body.classList.toggle("sidebar-open");

  btn.innerHTML = sidebar.classList.contains("open") ? "❮" : "❯";
}
