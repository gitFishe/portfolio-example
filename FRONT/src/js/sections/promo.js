
function sPromo(sections) {
   sections.forEach((section) => {

   })
}

document.addEventListener('DOMContentLoaded', function () {
    let sectionSelector = '.promo'

    if(document.querySelector(sectionSelector)) {
        sPromo(document.querySelectorAll(sectionSelector));
    }
});