# Chami Match - Technical Diagrams

This document provides visual representations of the application's architecture, data flow, and component relationships.

## Component Hierarchy

```mermaid
graph TD
    App[App.vue] --> Router[Vue Router]
    Router --> Welcome[WelcomeScreen.vue]
    Router --> Game[GameScreen.vue]
    Router --> Context[ContextGameScreen.vue]
    Router --> Relative[RelativeGameScreen.vue]
    Router --> Image[ImageGameScreen.vue]
    Router --> Recall[RecallGameScreen.vue]

    App --> Settings[SettingsPopup.vue]
    App --> About[AboutPopup.vue]
    App --> Record[RecordPopup.vue]
    App --> Reset[ResetPopup.vue]

    Game --> NavBar[GameNavBar.vue]
    Game --> Health[HealthBar.vue]
    Game --> ColorBlock[ColorBlock.vue]
    Game --> Toolbar[Toolbar.vue]

    Context --> NavBar
    Context --> Health
    Context --> ColorBlock
    Context --> Toolbar

    Relative --> NavBar
    Relative --> Health
    Relative --> RelativeView[RelativeGameView.vue]
    Relative --> Toolbar

    Image --> NavBar
    Image --> Health
    Image --> ColorBlock
    Image --> Toolbar

    Recall --> NavBar
    Recall --> Health
    Recall --> ColorBlock
    Recall --> Toolbar
```

## Data Flow

```mermaid
graph LR
    User[User Interaction] --> Components[Vue Components]
    Components --> Actions[Store Actions]
    Actions --> State[Store State]
    State --> Getters[Store Getters]
    Getters --> Components

    Actions --> GameModes[Game Modes]
    GameModes --> State

    LocalStorage[(Local Storage)] <--> State
```

## State Management

```mermaid
graph TD
    GameStore[Game Store] --> Sessions[Sessions]
    GameStore --> Preferences[Preferences]
    GameStore --> History[History]
    GameStore --> CurrentSession[Current Session]
    GameStore --> GameState[Game State]
    GameStore --> UIState[UI State]

    GameStore --> GameModes[Game Modes]

    GameModes --> StandardMode[Standard Mode]
    GameModes --> ContextualMode[Contextual Mode]
    GameModes --> RelativeMode[Relative Mode]
    GameModes --> ImageMode[Image Mode]
    GameModes --> RecallMode[Recall Mode]

    BaseMode --> StandardMode
    BaseMode --> ContextualMode
    BaseMode --> RelativeMode
    BaseMode --> ImageMode
    BaseMode --> RecallMode
```

## Game Mode Class Diagram

```mermaid
classDiagram
    class BaseMode {
        +constructor(options)
        +registerViewCallback(event, callback)
        +initState()
        +startRound()
        +checkGuess()
        +resetUserInput()
        +createHistoryRecord(wasSuccess)
    }

    class StandardMode {
        +constructor(options)
        +initState()
        +generateRandomColor()
        +startRound()
        +updateUserColor(h, s, v)
        +checkGuess()
        +createHistoryRecord(wasSuccess, round, sessionId)
    }

    class ContextualMode {
        +constructor(options)
        +initState()
        +generateColorOptions()
        +startRound()
        +selectColor(color)
        +checkGuess()
        +createHistoryRecord(wasSuccess, round, sessionId)
    }

    class RelativeMode {
        +constructor(options)
        +initState()
        +generateRandomColor()
        +startRound()
        +updateUserValueDifference(value)
        +checkGuess()
        +createHistoryRecord(wasSuccess, round, sessionId)
    }

    class ImageMode {
        +constructor(options)
        +initState()
        +generateColorOptions()
        +startRound()
        +selectColor(color)
        +checkGuess()
        +createHistoryRecord(wasSuccess, round, sessionId)
    }

    class RecallMode {
        +constructor(options)
        +registerViewCallback(event, callback)
        +initState()
        +generateColorOptions()
        +startRound()
        +checkGuess()
        +hideColor()
    }

    BaseMode <|-- StandardMode
    BaseMode <|-- ContextualMode
    BaseMode <|-- RelativeMode
    BaseMode <|-- ImageMode
    StandardMode <|-- RecallMode
```

## User Flow

```mermaid
graph TD
    Start[Start] --> Welcome[Welcome Screen]
    Welcome --> SelectMode[Select Game Mode]
    SelectMode --> StartGame[Start Game]
    StartGame --> GameScreen[Game Screen]

    GameScreen --> MatchColor[Match Color]
    MatchColor --> CheckGuess{Correct?}

    CheckGuess -->|Yes| NextRound[Next Round]
    CheckGuess -->|No| LoseLife[Lose Life]

    LoseLife --> LivesLeft{Lives Left?}
    LivesLeft -->|Yes| MatchColor
    LivesLeft -->|No| NextRound

    NextRound --> GameScreen

    GameScreen --> Settings[Settings]
    Settings --> GameScreen

    GameScreen --> ViewHistory[View History]
    ViewHistory --> GameScreen

    GameScreen --> About[About]
    About --> GameScreen

    GameScreen --> Exit[Exit to Welcome]
    Exit --> Welcome
```

## Internationalization Flow

```mermaid
graph TD
    App[App Start] --> DetectLang[Detect Browser Language]
    DetectLang --> CheckSupported{Supported?}
    CheckSupported -->|Yes| SetLang[Set Detected Language]
    CheckSupported -->|No| SetDefault[Set Default Language]

    SetLang & SetDefault --> LoadTranslations[Load Translations]
    LoadTranslations --> RenderUI[Render UI]

    UserChangesLang[User Changes Language] --> StoreLang[Store Preference]
    StoreLang --> LoadTranslations
```

## Theme Management Flow

```mermaid
graph TD
    App[App Start] --> CheckStorage[Check localStorage]
    CheckStorage --> ThemeFound{Theme Found?}
    ThemeFound -->|Yes| ApplySaved[Apply Saved Theme]
    ThemeFound -->|No| CheckSystem[Check System Preference]

    CheckSystem --> ApplySystem[Apply System Theme]

    UserChangesTheme[User Changes Theme] --> StoreTheme[Store Preference]
    StoreTheme --> ApplyNew[Apply New Theme]
```
