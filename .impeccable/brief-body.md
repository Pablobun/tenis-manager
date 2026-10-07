# Surface: app tenis-manager (frontend/src/app)

Visitor mode: Operate. Audiencia: profesora/admin en el club, alumno en su casa; uso mayoritario a 375px, outdoors con glared de sol. Job: ver el día, mover alumnos, cobrar. Action: inscribir/bajar alumnos, generar deudas, registrar pagos. Proof: cada cifra con su cuenta (precio × clases). Constraints: ENUMs en español, borde de tarjeta = cupo, chips de nivel con semántica de color, extras con borde rojo, sin tests (build manual), Gmail SMTP pendiente de credenciales.

Dirección elegida: **Polvo de Ladrillo** (pick del usuario). Momento memorable: el día dibujado como cancha — franjas horarias en líneas blancas sobre polvo, la clase "ahora" sobre la línea central.

Decisiones sin resolver: tratamiento del logo (placa negra vs. extracción con transparencia vía extract_logo); proveedor SMTP real (pendiente de credenciales).

## Direction contract

THESIS: La app es la cancha: el día de la profe se dibuja como polvo de ladrillo con líneas blancas. Rechaza el arreglo default de dashboard SaaS gris con sidebar y cards pastel.

OWN-WORLD: Polvo #B65434 posee headers, nav inferior y placas de sección a sangre; contenido sobre cal #F7F3EA con fichas blancas #FFFFFF; toda estructura son líneas de cancha (keylines 1.5-2px); amarillo feltro #D9E24F solo para acción primaria; rojo/cupo y verde/pagado son semántica, no paleta. Headers en condensed grotesque (eco del logo), UI en system stack, cifras tabulares.

STORY: La profe abre y ve su día como cancha: clases en franjas como fichas, cupo/alumnos/estado de un tap; su alumno ve sus clases del mismo modo.

FIRST VIEWPORT: header polvo con wordmark blanco; tira de días como línea de base (swipe cambia de día); fichas blancas sobre cal con keyline de cancha, la clase en curso destacada arriba; bottom nav en placa polvo. Acción primaria (nueva clase / inscribir) en feltro.

FORM: Polvo de Ladrillo — posición 1 de la lista fundamentada (IMPECCABLE'S PICK, elegida por el usuario) — seed key 6241a9ab.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
