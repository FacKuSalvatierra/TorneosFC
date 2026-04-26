# PES Torneos - App de Gestión de Torneos

## Project Overview
- **Nombre**: PES Torneos
- **Tipo**: Webapp interactiva
- **Funcionalidad**: Gestión de torneos de fútbol para amigos, con formatos de liga y eliminación directa, asignación de equipos manual o automática
- **Usuario objetivo**: Jugadores de PES que quieren organizar torneos con amigos

## UI/UX Specification

### Layout Structure
- **Header**: Logo + título "PES Torneos" con estilo gamer
- **Main**: Formulario de configuración + visualización delbracket/tabla
- **Footer**: Credits mínimos

### Responsive
- Mobile-first, breakpoints: 640px (sm), 768px (md), 1024px (lg)

### Visual Design

#### Color Palette
- **Background**: #0a0a0f (negro profundo)
- **Surface**: #16161f (card dark)
- **Primary**: #ff4d4d (rojo PES)
- **Secondary**: #1a1a2e (azul oscuro)
- **Accent**: #ffd700 (dorado - highlights)
- **Text Primary**: #ffffff
- **Text Muted**: #8888aa

#### Typography
- **Headings**: "Orbitron" (Google Fonts) - gaming feel
- **Body**: "Rajdhani" (Google Fonts)
- **Sizes**: h1: 2.5rem, h2: 1.75rem, body: 1rem

#### Effects
- Glowing borders en elementos activos
- hover: brightness increase
- transitions: 200ms ease

### Components

#### 1. Formulario de Configuración
- Input para nombre del torneo
- Selector: Liga / Eliminación Directa
- Input de cantidad de participantes (número)
- Input dinámico para nombres de participantes
- Botón "Iniciar Tournament"

#### 2. Panel de Asignación de Equipos
- Toggle: Manual / Automático
- Lista de equipos PES comunes
- Si manual: dropdown por jugador
- Si automático: botón "Sortear Equipos"

#### 3. Vista de Liga
- Tabla de posiciones
- Partidos disputados/en progreso
- Puntos, GF, GC, diferencia

#### 4. Vista de Eliminación
- Bracket visual
- Indicador de ronda actual
- Avanzar siguiente ronda

## Functionality Specification

### Core Features
1. **Crear Tournament**:
   - Nombre del torneo
   - Formato: Liga o Knockout (eliminación)
   - Cantidad de equipos: 2-16
   - Nombres de jugadores

2. **Asignación de Equipos**:
   - Manual: cada jugador elige equipo
   - Automática: random entre equipos PES

3. **Simulación de Partidos**:
   - Generación aleatoria de resultados
   - Actualización de tabla/bracket

4. **Guardado**:
   - LocalStorage para persistencia

### Equipos PES Disponibles
Barcelona, Real Madrid, Bayern, Juventus, PSG, Manchester United, Liverpool, Chelsea, City, Arsenal, Atlético Madrid, Milan, Inter, Dortmund, Tottenham, Napoli

## Acceptance Criteria
- [ ] Usuario puede crear torneo con nombre
- [ ] Usuario puede elegir formato liga o eliminación
- [ ] Usuario puede ingresar 2-16 participantes
- [ ] Usuario puede asignar equipos manual o automático
- [ ] Vista de tabla de posiciones muestra resultados
- [ ] Vista de bracket muestra progreso
- [ ] Datos persisten en localStorage