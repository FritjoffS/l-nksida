# PIN-baserad inloggning för Schema-appen

## Översikt
Schema-appen använder nu ett dubbelt inloggningssystem:

1. **L-nksida-inloggning** - Firebase Authentication (email/lösenord) - delas av alla som använder l-nksida
2. **Schema-inloggning** - PIN-kod (4 siffror) - unik för varje anställd

## Hur det fungerar

### För personal:
1. Logga in på l-nksida med vanligt email/lösenord
2. Navigera till Schema-appen
3. Ange din 4-siffriga personalkod
4. Din profil laddas och du kan stämpla in/ut

### För administratörer:

#### Skapa ny personal:
1. Logga in på l-nksida som admin
2. Öppna schema-appen och ange din PIN
3. Klicka på "⚙️ Admin" i headern
4. Under fliken "Personalhantering", klicka "➕ Lägg till personal"
5. Fyll i:
   - Namn
   - E-post
   - Roll (Personal/Administratör)
   - **Personalkod (4 siffror)** - Detta är personalens PIN-kod för schema-appen
   - Anställningsnummer (valfritt)
6. Klicka "Spara"

#### Redigera personal:
- Klicka på "✏️" på ett personalkort
- Uppdatera PIN-koden om personal glömt sin kod
- Klicka "Spara"

## Säkerhet

### PIN-koder:
- Måste vara exakt 4 siffror
- Lagras i Firebase Realtime Database
- Varje personal har sin egen unika PIN
- Kan ändras av administratörer när som helst

### Session:
- PIN-inloggning sparas i sessionStorage
- Försvinner när webbläsaren stängs
- Olika personer kan använda samma enhet genom att byta PIN

## Byta användare

För att byta till en annan personal:
1. Klicka på "Logga ut" (eller "Tillbaka till l-nksida") i PIN-modalen
2. En ny PIN-modal visas
3. Ange den nya personalens PIN-kod

## Felmeddelanden

- **"Ange 4 siffror"** - PIN-koden måste vara exakt 4 siffror
- **"Felaktig personalkod"** - Ingen personal har denna PIN i systemet
- **"Inga användare hittades"** - Ingen personal är registrerad i systemet än (kontakta admin)

## Tekniska detaljer

### Databasstruktur:
```
schema/
  users/
    <staffId>/
      name: "Anna Andersson"
      email: "anna@example.com"
      role: "staff"
      pin: "1234"
      employeeId: "EMP001"
```

### Session-hantering:
```javascript
// PIN-inloggning sparar staff-ID i session
sessionStorage.setItem('schemaStaffId', staffId);

// Alla databas-operationer använder staffId istället för Firebase auth.uid
schema/timeEntries/${currentStaffId}/...
```

## Vanliga frågor

**Q: Vad händer om jag glömmer min PIN?**  
A: Kontakta en administratör som kan återställa din PIN via admin-panelen.

**Q: Kan flera personer använda samma enhet?**  
A: Ja! Varje person loggar in med sin egen PIN. Session rensas när man loggar ut eller stänger webbläsaren.

**Q: Behöver jag logga in på l-nksida först?**  
A: Ja, Firebase Authentication krävs fortfarande för att komma åt l-nksida. PIN-koden är endast för schema-appen.

**Q: Kan jag ändra min PIN själv?**  
A: Nej, endast administratörer kan ändra PIN-koder via admin-panelen.
