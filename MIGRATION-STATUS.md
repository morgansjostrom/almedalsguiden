# Almedalskompassen – migrationsstatus (fas 1)

Datum: 2026-10-26. Källa: import-ZIP, källcommit 07665fd. Originalet (almedalsguiden-morgan-ny.earlywren128.chatgpt.site) är orört. Projektet är inte publicerat och ingen domän är flyttad.

## Gjort
- 2026-11-01: Demot anpassat till exakt 20 fiktiva exempelprofiler med unika bilder och varierade närvarodagar i kommande vecka 26 (28 juni–2 juli 2027). Befintlig adminvy används för sök- och filtertest; inga konton eller deltagarposter skapas. Piloten förblir stängd och inget publiceras.
- 2026-11-01: Nätverkskatalog med bilder/initialer, kort- och listvy, namn/ämne/organisation/roll/datum-filter, 20 deltagare per sida och sortering efter gemensamma delade intressen/dagar. Matchning använder bara aktiv nätverksprofil, aldrig privata mål eller favoriter. Admin kan granska 24 fiktiva exempelprofiler med genererade bilder; de sparas inte som deltagare och kan inte kontaktas. Piloten förblir stängd. 12 regeltester godkända; inloggad admin, filtrering, 20/4 sidindelning, profilvisning och 390 px utan sidledsöverflöde verifierade. Riktiga tillfälliga pilotkonton: profilmedgivande, förfrågan, accepterat samtal och läst svar, rapport/admin, blockering och åtkomstskydd verifierade; testkonton borttagna. Build OK; ingen publicering.
- 2026-11-01: Informationsraden ”Din profil och dina bedömningar sparas privat på ditt konto.” borttagen efter profilladdning; sparande och felstatus oförändrade. week.js versionsmärkt v=3. Ingen publicering.
- 2026-11-01: Inloggningssidan flyttad till /signin, med svenska/engelska enligt sparat språkval eller enhetsspråk. Inloggning, kontoskapande och lösenordslänk översatta; gamla adresser vidarebefordras med återgång bevarad. Ingen publicering.
- Verifierat: 14 tester godkända, gamla adressen leder till /signin med återgång/hash, engelska kontolägen och svenskt sparat språkval, arrangörslänk och Min Almedalsvecka från Kontakt. Build OK; ingen ny inloggning eller e-postleverans provad i denna ändring.
- 2026-11-01: Kontakta oss återanvänder arrangörssidornas toppbild och stilmall med fyra kontaktfält. Klient- och servervalidering; formuläret rapporterar inte framgång utan skickat mejl. E-postleverans blockerad: ingen avsändardomän är konfigurerad. Ingen publicering.
- 2026-11-01: Annonsera och publika Arrangörsverktyg använder arrangörslandningens Visbybild och kortstil. Annonsera visar grundpaketets 24 000 kr/år exkl. moms, faktura och utökat paket utan påhittat pris. Åtta verktyg presenteras utan testkontroller; befintlig planering behålls separat på arrangor-planera.html och laddas först efter verifierad arrangörsstatus. Mobil/dator, meny, utloggad omdirigering och inloggad admin med programresultat verifierade; nio tester godkända. Ingen publicering.
- 2026-11-01: Överflödig statusrad ovanför inloggningskorten borttagen för utloggade besökare. Inloggning och kontostatus behålls; ingen publicering.
- 2026-11-01: Arrangörslandningen utbyggd med grundpaketets fyra delar, faktura/inloggning och information om utökat paket. Tillbakalänken borttagen och båda arrangörssidornas inloggningskontroller tidsbegränsade. Verifierat: inloggad admin via inloggningssidan och servercookie till arbetsytan, utloggning, 390 px utan sidledsöverflöde och långsam statuskontroll utan blockerad inloggning. 11 tester godkända; ingen publicering.
- 2026-11-01: Automatisk arrangörslänkning begränsad till artikelavsändare och programpunkternas arrangörsfält. Rubriker, löptext och varumärket lämnas orörda. Versionsmärkning uppdaterad; ingen publicering.
- 2026-10-27: Utfällda schemapunkter återanvänder programvyns fullständiga information och typografi, inklusive talare, språk, beskrivningar, arrangör, kalender och gångväg.
- 2026-10-27: Min profil samlar tidigare privata profil- och nätverksformulär. Ett gemensamt val av intressen, profilfoto, Privat / Nätverka samt programbevakning sist. Nätverkande kräver fortsatt granskning och aktivt medgivande; foto delas endast med nytt network-v2-medgivande. Äldre publicerad pilot behåller network-v1, utan åtkomst till foton.
- Min Almedalsvecka-menyn ordnas Min profil, Mitt schema, Förslag för dig, Medverkande i programmet, Nätverka med andra besökare. Verifierat med inloggade testkonton, fotosparande/omladdning/radering, privat läge, samtycke och nätverksflöden. Ingen publicering i denna ändring.
- Hela `public/` (HTML, CSS, JS, bilder, kompasslogga, typsnitt, översättningar, programfiler, artiklar) kopierad oförändrad. Ingen design-, text- eller funktionsändring.
- `/` omdirigerar till `/index.html` som i källan. Rena adresser (`/schema`, `/program`, `/talare` …) omdirigerar till `.html` med query och hash bevarade (djuplänkar `?event=id|day|start`).
- API-rutterna finns kvar med samma URL, metoder och JSON-format, i utloggat läge mot tom databas: favorites, week, newsletter, popularity, speaker-profiles, speaker-reports, organizers (A Beautiful Soup som demo, `canEdit:false`), organizer-assets. Alla skrivningar nekas.
- `/signin-with-chatgpt` visar att inloggning inte är aktiverad. ChatGPT-headers eller klient-id används aldrig som identitet.
- Inga anrop till originalets API eller databas.
- Två oanvända äldre helårsfiler (`public/events.json`, `program-runtime/events-45d0a393a9632da5.json`, >10 MB) ligger i filarkivet, se `migration-archive/*.asset.json`. Inga sidor refererar dem; årsfilerna används.

## Verifierat
- Programdata: 2022 1945, 2023 2101, 2024 2124, 2025 2447, 2026 3211, 2027 11 = 11 839. 11 839 unika `id|day|start`, identiska med källans `lib/event-refs.json` (0 saknas). Fält som sponsoredDemo, speakers, organizer, place, subject m.fl. orörda.
- Alla 11 sidor laddar utan JS-fel i desktop (1280) och mobil (390): startsida, program/karta, Min Almedalsvecka, talare, arrangör, arrangörsverktyg, annonsera, kontakt, integritet, mobil.

## Fas 2 (2026-10-26): databas och inloggning
- Egen databas i Lovable Cloud: favoriter, Min Almedalsvecka-profiler, nyhetsbrevssamtycken, arrangörsprofiler, roller. Varje konto når bara sina egna rader.
- Inloggning med Google eller e-post/lösenord på originalets adress /signin-with-chatgpt (Min Almedalsvecka och Logga in som arrangör). Utloggning på /signout-with-chatgpt. Återställning av lösenord på /reset-password.
- Servern verifierar sessionen och lägger den i en HttpOnly-cookie. Headers eller klientens id litas aldrig på.
- Roller: admin (morgan.sjostrom@gmail.com, aktiveras vid första inloggning med bekräftad e-post), arrangör (endast godkända konton). Bara de kan redigera arrangörsprofilen.
- Verifierat med två tillfälliga testkonton (borttagna efteråt): inloggning, sparad favorit, konto B ser inte A:s favoriter, ett manipulerat userId ignoreras, arrangörsrätt bara med roll, utloggning tar bort åtkomsten.

## Fas 3 (2026-10-26): betalning för arrangörer
- Stripe (testläge): "Arrangörspaket årskostnad", 24 000 kr/år exkl. moms, årsabonnemang. Stripe sköter moms, bedrägeriskydd och tvister (+3,5 % per transaktion).
- Köp sker på /arrangor-betalning efter inloggning. Länk visas på "Logga in som arrangör". Aktivt abonnemang ger arrangörsåtkomst. Webbhook med signaturkontroll uppdaterar abonnemanget.
- Demoprofilen A Beautiful Soup kan bara ändras av admin.
- Verifierat: inloggad arrangör ser "Köp arrangörspaket" och betalformuläret laddas med rätt pris inkl. moms. Ej verifierat: att en genomförd testbetalning aktiverar åtkomsten (automatiserat test fastnade i kassan).
- Kvar: egen profil per betalande arrangör finns inte i originalet och kräver beslut.

## Kvar
- Fillagring för arrangörsbilder. Koppling av gamla konton (verifierad e-post) innan privata data importeras.
- Publika hjärtan för gäster, nyhetsbrevssamtycken, talarrapporter, bilduppladdning (≤5 MB, PNG/JPEG/WebP).
- R2-inventering saknas – kvarstående lucka.
- Privata konton importeras inte förrän schema och behörigheter verifierats. Webbläsarlokala favoriter/cookies kan inte flyttas centralt.
- Detaljtester enligt GODKANNANDE.md (filter, årsväxling, språk utan flimmer, bottenmeny, kalenderexport) är inte genomförda i detalj.
- Ingen publicering.

- MCP (agent integrations): OAuth-protected endpoint /api/public/mcp with list_favorites, set_favorite; consent page /.lovable/oauth/consent. Not tested with an external client; not published.

## Ägarmenyer/avvikelser (2026-10-26, Morgan godkänt)
- Högerspalten (schema): "Aktivera synk"/"Synkronisera nu" borttagna – synk aktiveras automatiskt vid inloggning. "Logga in"/"Logga ut" finns kvar.
- Hela panelen "Språk & översättning" borttagen ur sidospalten (språkväljare 🇸🇪/🇬🇧 i sidhuvudet finns kvar). Engelskinsgte-länken till panelen borttagen ur språknotisen.
- Gemensam mörkblå helskärmsmeny på alla statiska mobilsidor (≤800px), med personliga/arrangörsflikar först, Utforska-länkar, textbaserat språkval, verifierad sessionsstatus och originalets kompasslogga längst ner. Bottenmenyn behålls och döljs när menyn är öppen; datorversionen orörd.
- Verifierat i mobilstorlek på alla elva sidor: helskärm, språkbyte, Escape/stängning och återställd fokus. Min profil-fliken och Min Almedalsvecka → inloggning fungerar. Inga JS-fel; datormeny verifierad. Inloggad meny ej end-to-end-verifierad i denna omgång. Ingen ny publicering.

## Sidfot (2026-10-26, Morgan)
- Texten i sidfotens vänstra kolumn ändrad till "Almedalskompassen hjälper dig att hitta samtalen som angår dig – och människorna du vill möta." på alla elva statiska sidor.
- Under "Upptäck" finns nu bara Artiklar och Program & karta (Ämnen-länken borttagen ur sidfoten; den finns kvar i sidospalt och navigation).
- Verifierat i förhandsvisningen på desktop (1280) och mobil (393): rätt text på alla sidor, inga JS-fel. Ingen ny publicering.

## Arrangörslandning (2026-10-26, Morgan)
- "Logga in som arrangör" (sidfot, mobilmeny, annonserasidan) leder nu till /arrangor-start.html – en landningssida där man kan logga in eller köpa arrangörspaketet.
- Sidan visar tre tillstånd: utloggad (logga in först), inloggad utan åtkomst (Köp arrangörspaketet → /arrangor-betalning), inloggad med åtkomst (Till arrangörsverktyget → /arrangor-login.html).
- Originalets arbetsyta /arrangor-login.html är oförändrad och nås efter inloggning/betalning.
- Verifierat i förhandsvisningen: utloggad, inloggad admin (morgan.sjostrom@gmail.com) och inloggad utan åtkomst (tillfälligt testkonto, borttaget efteråt). Inga JS-fel. Desktop och mobil.
- Sidfotens mening är nu "Vi hjälper dig att hitta samtalen som angår dig – och människorna du vill möta." på alla sidor, så namnet inte upprepas direkt efter kompassloggan.
- Cache-busting: languages.js och workspace-mobile-menu.* refereras med ?v=3; arrangor-start.css/js med ?v=1. Ingen ny publicering.

## Aktuellt just nu – svepbar på mobilen (2026-10-26, Morgan)
- I förhandsvisningen låg artikelkorterna i "Aktuellt just nu" för trångt på telefon och var svårlästa.
- Blocket är nu en vågrät, svepbar rad på skärmar upp till 700 px: ett artikelkort i taget, med nästa kort skymtande till höger som ledtråd. Svep åt höger för att läsa fler.
- Kortens innehåll, ordning, rubriker, arranger och "Sponsrat innehåll" är oförändrade. Datorsidan är orörd.
- Verifierat i förhandsvisningen vid 390 px: raden är svepbar (3 kort), ett kort i taget är fullt läsbart, nästa kort skymtar, inga JS-fel.
- Ändringen ligger i index.html (inline-CSS), ingen ny publicering.

## Mobiluppdateringar och logga (2026-10-26)
- Reproducerat i färsk mobilförhandsvisning: arrangörslänkningen ersatte sidhuvudets varumärkeslänk och omslöt sidfotens namn med en blå, understruken arrangörslänk när profilen heter Almedalskompassen.
- Varumärke, sidhuvud, sidfot, mobilmeny och data-no-translate undantas nu från denna automatiska länkning. Delad loggstil behåller färg och tar bort understrykning.
- organizer-links.js, branding.css och site-chrome.css får versionsmarkeringar på alla statiska sidor; tidigare saknade de sådana.
- Publicerad adress leder en utloggad webbläsare till Lovables inloggning. Dess sidinnehåll kan därför inte jämföras utan åtkomst; senaste meny och artikelsvep kontrolleras i förhandsvisningen. Ingen ompublicering begärd eller utförd.
- Verifierat: loggan intakt på alla 12 statiska sidor, mobilmenyn öppnas/stängs och artiklar sveps utan JS-fel; datorsidans logga intakt. Förhandsvisningen bygger utan fel.

## Enhetliga svepbara artikelkort (2026-10-26)
- Alla tre mobila artikelkort har samma bredd, 200 px bildhöjd och samma rubrik-/ingressformat. Texten behålls utan avkortning; korten sträcks till gemensam höjd.
- Verifierat vid 393 px: varje kort 297 × 629 px, bild 200 px, rubrikyta 94 px och ingressyta 167 px. Desktopregler oförändrade. Ingen publicering.
- Startsidesinledningen undantas också från arrangörslänkningen: Almedalskompassen i meningen under huvudrubriken ska vara vanlig vit text, inte en arrangörslänk.

## Mobilmeny: rubrik bort, Utforska-fastställd länklista (2026-10-26)
- "Almedalskompassen" borttagen som rubrik längst upp i helskärmsmenyn på vanliga sidor; arbetsytorna (Min/Vår Almedalsvecka) behåller sina sidnamn.
- Utforska innehåller nu exakt: Programpunkter (program.html), Talare, Logga in som arrangör, Kontakt.
- workspace-mobile-menu.js och .css versionsmärkta ?v=5; languages.js och dess referenser i alla 12 HTML-filer ?v=5.
- Översättningstillskott: "Logga in som arrangör" → "Sign in as organiser".
- Länkverifiering i förhandsvisningen vid 393 px: 64 klick på sju sidor, 0 fel – rätt mål, HTTP <400, menyn stängd efter varje klick, inga JS-fel.

## 2026-10-27 – Fakturabaserade arrangörskonton
- Kortbetalning borttagen (/arrangor-betalning leder till arrangor-start.html, checkout svarar 410).
- Admin skapar konto på /admin/arrangorer (skyddad, noindex, ej länkad): tillfälligt lösenord visas en gång, åtkomst ett år från startdatum, förläng/nytt lösenord/stäng av.
- Arrangören loggar in med e-post + lösenord och måste byta lösenord vid första inloggningen. Verifierat end-to-end; testkonton borttagna.

## 2026-10-27 – Översättningspaket 2026-10-26 infört
- 3 211 engelska programöversättningar (43 nya, 0 ändrade, 0 bara i målet), 50 svenska versioner, 68 artiklar (oförändrade).
- 2026-underlaget är byte-identiskt med paketets original; signaturer kontrolleras vid visning.
- Engelska laddas i 13 delar (translations/en-runtime/), alla delar måste laddas annars visas original med nytt försök. Visningskoden för svenska versioner togs från paketet; languages.js lämnades orörd.

## 2026-10-27 – Etiketten "DAG FÖR DAG" förenad med övriga flikar
- schedule.css: `.schedule-section-heading .kicker, .schedule-map-heading .kicker` var 9 px och blå (#12699c); nu 10 px, #082e4e och 1,3 px avstånd – samma som `.kicker` på de andra flikarna.
- Gäller även kartans etikett "HITTA MELLAN SAMTALEN", som delade samma regel och står bredvid.
- schedule.css versionsmärkt ?v=1 i schema.html, arrangorsverktyg.html, arrangor.html och arrangor-login.html så mobilen hämtar den nya filen.
- Verifierat i förhandsvisningen: alla fyra flikarnas etiketter 10 px / rgb(8,46,78) / 1,3 px vid 393 px och 1280 px; rubrikerna ligger inom 3 px (mobil 485–486, dator 436–439); inga JS-fel; schedule.css svarar 200 på alla fyra sidorna.

### 2026-10-27 – exakt placering av Dag för dag
- Justerat endast marginalen ovanför schemats etikett, separat för mobil och dator; schema.html hämtar workspace-mobile-menu.css?v=13.
- Verifierat alla fyra flikar vid 393 px och 1280 px: etiketternas överkant är identisk (463,4375 px respektive 413,0625 px). Build OK. Inte publicerat.

## 2026-10-27 – frivilligt nätverkande, stängd pilot
- Godkänd plan genomförd i originalets statiska besökarvy med separat Nätverka-flik, opt-in-profil med förhandsgranskning och versionerat medgivande, deltagarsökning, kontaktförfrågningar, accepterade privata samtal, blockering och rapportering.
- Morgan ändrade namnen till Medverkande i programmet respektive Nätverka med andra besökare; meny, rubrik och engelska namn verifierade vid 393/873/1280 px.
- Separata network_* tabeller med explicita GRANT/RLS, endast verifierad cookie-session, atomisk command RPC, beständiga begränsningar och avstängning. Befintliga privata week_profiles/favorites och MCP oförändrade.
- Nätverkande är låst till admin/explicit testallowlist. Inga besökarprofiler blev sökbara automatiskt. Integritetssidan beskriver pilotens användning och saknade lanseringsuppgifter.
- Två riktiga syntetiska sessioner testade genom formulär och UI: dela, sök, förfrågan, acceptans, meddelande och läst svar. Admin hanterade meddelanderapport i UI. Behörighets-, dubblett-, gräns-, döljnings-, avstängnings- och blockeringstester godkända; 12 Vitest-regeltester godkända. Alla testkonton/profiler/rapporter/gränsposter borttagna (databaskontroll: 0).
- Dokumenterat i NETWORKING-TESTING.md och tests/networking_flow.py. Build OK. Inte publicerat.
- Öppning blockerad av fastställd personuppgiftsansvarig, kontaktväg, lagringstider, rättsliga grunder och modererings-/raderingsrutiner; AI, app, pushnotiser, kalender och delat schema ingår inte.

## 2026-11-01 – programmet på startsidan
- Sidfot, sökformulär, artikel-, schema-, kalender- och arrangörslänkar pekar på startsidans #programrubrik.
- Sökfilter och eventreferenser förs vidare till programmets iframe. Gamla program.html-adresser omdirigeras till startsidan; inbäddningen är kvar.
- Berörda skript versionsmärkta. Ingen publicering i denna ändring.
- Verifierat i webbläsaren: sidfot från Kontakt, gammal programadress med sökfilter, event 6531|2027-06-24|10:30 och sökning från sidhuvudet. Fem tester godkända; build OK. Utvecklingsserverns index.html-loop rättad utan att ändra HTML-utseendet; startsidans omdirigering behåller query och hash.

## 2026-11-01 – Logga in som arrangör förkortad
- arrangor-start.html: ny rubrik "Logga in som arrangör", kortare intro, paketsektionen (fyra punkter, utökat paket, kontroll över innehåll) borttagen; "Beställ arrangörspaketet" ersatt av "Priser och paket" med länk till annonsera.html.
- Sidtitel och beskrivningar uppdaterade; arrangor-start.js versionsmärkt ?v=5 (status vid saknad åtkomst nämner Annonsera).
- Verifierat i dator- och mobilvy: paketsektionerna borta, länken går till annonsera.html, statusrutan dold för utloggade. 2 tester godkända. Inte publicerat.

## 2026-11-01 – Nätverksdeltagarkort omstrukturerade
- networking.css: deltagarkatalogen i tre kolumner (2 kolumner ≤800px, 1 kolumn ≤520px), korten i ljusblått (#eaf3fa) med egen kantfärg och svag skugga; foto (110px), namn, roll och organisation centrerade överst på kortet. Listvyn behåller radlayouten.
- schema.html versionsmärker networking.css?v=5.
- Verifierat inloggad i webbläsaren: 20 exempelprofiler, tre lika kolumner, centrerat foto, ljusblå bakgrund; mobilvy en kolumn; listvyn orörd. Inte publicerat.
- Nätverka: skarpare matchning – söker/erbjuder (fasta val), frivillig schemamatchning (endast antal gemensamma programpunkter, båda måste välja det), gemensam dag krävs, förklaring "Därför föreslås" på korten.

## 2026-11-10 – engelska programtitlar för 2025
- Morgans zip innehöll 1 650 av 2 447 engelska titlar för 2025; samtliga ID, datum, start-/sluttider och svenska titlar matchade befintlig programdata exakt. 797 titlar återstår enligt exportens README.
- Sju nya delar i translations/en-runtime/ ökar det totala antalet engelska poster från 3 211 till 4 861. Befintliga 2026-poster och originalprogrammet är oförändrade.
- Exporten saknar översatta beskrivningar och övriga textfält. event-i18n.js visar därför engelska endast för fält som verkligen finns i en post och behåller originaltexten för övriga fält.
- Tre Vitest-tester godkända. Webbläsarverifiering av 554|2025-06-23|07:00: engelsk titel med lang=en, svensk beskrivning kvar med lang=sv och manifestet laddat med 4 861 poster. Inte publicerat.
