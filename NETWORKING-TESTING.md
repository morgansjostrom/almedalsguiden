# Nätverkande: förhandsvisning och lanseringskrav

## Förhandsvisning
- Logga in med ditt adminkonto och öppna Min Almedalsvecka.
- Under Min profil finns Min nätverksprofil. Uppgifterna är separata från din privata profil.
- Fyll i profil, förhandsgranska, markera medgivande och välj att dela. Alternativet Spara dolt gör profilen osökbar.
- Under Nätverka med andra besökare finns deltagarsökning, kontaktförfrågningar och blockerade kontakter.
- Rapporthantering finns på `/admin/natverk`. Den kräver verifierad adminbehörighet.
- Vanliga besökare är spärrade tills lanseringskraven är klara. Inga riktiga profiler har automatiskt delats.

## Verifierat
Två tillfälliga deltagare skapade och delade profiler genom formuläret, hittade varandra med intressesökning, skickade förfrågan, accepterade och läste ett verkligt svar genom samtalsvyn. En meddelanderapport visade endast rapporterat innehåll för admin och kunde markeras hanterad.

Även kontrollerat: oinloggad/icke godkänd åtkomst, direkt databasåtkomst utan rättighet, självkontakt, saknad medgivandeversion, obehörig adminåtkomst, dold profil, bibehållet accepterat samtal efter döljning, samtidiga dubbletter, avböjande, förfrågningsgräns, avstängning som överlever profilradering samt blockering som stoppar läsning och nya meddelanden.

Mobilmeny, långa namn, svenska/engelska namn och frånvaro av sidledsöverflöde kontrollerades vid 393, 873 och 1280 px. Befintlig talarlista heter nu Medverkande i programmet och är åtskild från deltagare.

Automatiska regeltester: `bunx vitest run src/lib/networking.test.ts src/lib/organizer-accounts.test.ts` (12 godkända).

End-to-end-regression finns i `tests/networking_flow.py`. Den använder endast tillfälliga syntetiska konton på den egna miljön och tar bort dem i en finally-sektion. Kräver miljöns hanterade nycklar och en lokalt mintad adminsession. Logga aldrig sessioner eller nycklar. Testet är avsett för sandlådan, inte oövervakad produktion.

## Säkerhetsgränser i pilot
- Högst 10 kontaktförfrågningar per 24 timmar, 60 meddelanden per timme och 5 rapporter per 24 timmar.
- Ny förfrågan till samma person tidigast sju dagar efter föregående försök.
- Historik för begränsningar, medgivanden, blockering och avstängning finns separat från raderbart profil- och samtalsinnehåll.
- Ingen adminåtkomst till privata samtal i allmänhet; bara rapporterade kopior kan granskas.
- Funktionen har ingen AI-matchning, automatisk kontaktuppgiftsdelning, kalenderbokning, mejl eller pushnotiser.

## Före öppning
Morgan behöver fastställa personuppgiftsansvarig, kontaktväg, lagringstider inklusive rapport- och medgivandehistorik, rättsliga grunder och vem som sköter moderering och raderingsbegäran. Implementera fastställda lagrings-/raderingsrutiner och granska informationen innan pilotgrinden ändras. Öppning och publicering är separata beslut. Ingen publicering gjordes i detta arbete.