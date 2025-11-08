let verslagen = [];
let filteredVerslagen = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
   loadVerslagen();

   document.getElementById("prevBtn").addEventListener("click", () => {
      if (currentIndex > 0) {
         currentIndex--;
         showVerslag(currentIndex);
      }
   });

   document.getElementById("nextBtn").addEventListener("click", () => {
      if (currentIndex < filteredVerslagen.length - 1) {
         currentIndex++;
         showVerslag(currentIndex);
      }
   });

   document.getElementById("searchInput").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      filteredVerslagen = verslagen.filter(v =>
         v.titel.toLowerCase().includes(term) ||
         v.inhoud.toLowerCase().includes(term)
      );
      currentIndex = 0;
      showVerslag(currentIndex);
   });
});

function loadVerslagen() {
   fetch("/api/verslagen")
      .then(response => response.json())
      .then(data => {
         verslagen = data;
         filteredVerslagen = data;
         currentIndex = 0;

         if (verslagen.length === 0) {
            document.getElementById("mechanicReportList").innerHTML = "<p>Geen verslagen gevonden.</p>";
            return;
         }

         showVerslag(currentIndex);
      })
      .catch(error => {
         console.error("Fout bij ophalen van verslagen:", error);
      });
}

function showVerslag(index) {
   const reportList = document.getElementById("mechanicReportList");
   reportList.innerHTML = "";

   if (filteredVerslagen.length === 0) {
      reportList.innerHTML = "<p>Geen verslagen gevonden.</p>";
      updateButtons();
      document.getElementById("verslagCounter").textContent = "0/0";
      return;
   }

   const verslag = filteredVerslagen[index];
   const reportItem = document.createElement("div");
   reportItem.className = "report-item";
   reportItem.innerHTML = `
      <h3>${verslag.titel}</h3>
      <p>${verslag.inhoud}</p>
      <small>Ingediend op: ${new Date(verslag.aangemaakt_op).toLocaleString()}</small>
      <hr>
   `;
   reportList.appendChild(reportItem);

   updateButtons();

   const counter = document.getElementById("verslagCounter");
   counter.textContent = `${index + 1}/${filteredVerslagen.length}`;
}

function updateButtons() {
   const prevBtn = document.getElementById("prevBtn");
   const nextBtn = document.getElementById("nextBtn");

   const isFirst = currentIndex === 0;
   const isLast = currentIndex === filteredVerslagen.length - 1;

   prevBtn.disabled = isFirst;
   nextBtn.disabled = isLast;

   prevBtn.classList.toggle("disabled", isFirst);
   nextBtn.classList.toggle("disabled", isLast);
}
