// sidebar.js
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const btn = document.getElementById("sidebar-toggle");
  sidebar.classList.toggle("open");
  btn.innerHTML = sidebar.classList.contains("open") ? "❯" : "❮";
}
