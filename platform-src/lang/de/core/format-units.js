const nf = n => (n < 0 ? '−' : '') + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const U = { km: X('км','km','km'), kg: X('кг','kg','kg'), m3: X('м³','m³','m³'), mln: X('млн ₸','Mio. ₸','M ₸'), mo: X('мес','Mon.','mo'), yr: X('года','Jahre','years') };
