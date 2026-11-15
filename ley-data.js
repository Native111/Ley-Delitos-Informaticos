/* Ley Especial contra los Delitos Informáticos — Venezuela (2001)
   Texto transcrito del PDF oficial: ley-especial-contra-los-delitos-informaticos.pdf */

const LEY_META = {
  nombre: "Ley Especial contra los Delitos Informáticos",
  pais: "República Bolivariana de Venezuela",
  organo: "Asamblea Nacional",
  promulgacion: "4 de septiembre de 2001",
  fuente: "Gaceta Oficial de la República Bolivariana de Venezuela",
  descripcion:
    "La presente ley tiene por objeto la protección integral de los sistemas que utilicen tecnologías de información, así como la prevención y sanción de los delitos cometidos contra tales sistemas o cualquiera de sus componentes o los cometidos mediante el uso de dichas tecnologías, en los términos previstos en esta ley.",
};

const TITULOS = [
  { id: "I", nombre: "Disposiciones Generales", desde: 1, hasta: 5 },
  {
    id: "II",
    nombre: "De los delitos",
    desde: 6,
    hasta: 26,
    capitulos: [
      { id: "I", nombre: "De los delitos contra los sistemas que utilizan tecnologías de información", desde: 6, hasta: 12 },
      { id: "II", nombre: "De los delitos contra la propiedad", desde: 13, hasta: 19 },
      { id: "III", nombre: "De los delitos contra la privacidad de las personas y de las comunicaciones", desde: 20, hasta: 22 },
      { id: "IV", nombre: "De los delitos contra niños o adolescentes", desde: 23, hasta: 24 },
      { id: "V", nombre: "De los delitos contra el orden económico", desde: 25, hasta: 26 },
    ],
  },
  { id: "III", nombre: "Disposiciones comunes", desde: 27, hasta: 31 },
  { id: "IV", nombre: "Disposiciones Finales", desde: 32, hasta: 33 },
];

const ARTICULOS = [
  {
    n: 1, titulo: "Objeto de la ley",
    p: ["La presente ley tiene por objeto la protección integral de los sistemas que utilicen tecnologías de información, así como la prevención y sanción de los delitos cometidos contra tales sistemas o cualquiera de sus componentes o los cometidos mediante el uso de dichas tecnologías, en los términos previstos en esta ley."],
    kw: ["objeto", "protección", "sistemas", "tecnologías de información", "prevención", "sanción", "alcance"],
  },
  {
    n: 2, titulo: "Definiciones",
    p: ["A los efectos de la presente ley, se entiende por:"],
    defs: [
      { k: "a", t: "Tecnología de Información", v: "rama de la tecnología que se dedica al estudio, aplicación y procesamiento de data, lo cual involucra la obtención, creación, almacenamiento, administración, modificación, manejo, movimiento, control, visualización, distribución, intercambio, transmisión o recepción de información en forma automática, así como el desarrollo y uso del \"hardware\", \"firmware\", \"software\", cualesquiera de sus componentes y todos los procedimientos asociados con el procesamiento de data." },
      { k: "b", t: "Sistema", v: "cualquier arreglo organizado de recursos y procedimientos diseñados para el uso de tecnologías de información, unidos y regulados por interacción o interdependencia para cumplir una serie de funciones específicas, así como la combinación de dos o más componentes interrelacionados, organizados en un paquete funcional, de manera que estén en capacidad de realizar una función operacional o satisfacer un requerimiento dentro de unas especificaciones previstas." },
      { k: "c", t: "Data", v: "hechos, conceptos, instrucciones o caracteres representados de una manera apropiada para que sean comunicados, transmitidos o procesados por seres humanos o por medios automáticos y a los cuales se les asigna o se les puede asignar significado." },
      { k: "d", t: "Información", v: "significado que el ser humano le asigna a la data utilizando las convenciones conocidas y generalmente aceptadas." },
      { k: "e", t: "Documento", v: "registro incorporado en un sistema en forma de escrito, video, audio o cualquier otro medio, que contiene data o información acerca de un hecho o acto capaces de causar efectos jurídicos." },
      { k: "f", t: "Computador", v: "dispositivo o unidad funcional que acepta data, la procesa de acuerdo con un programa guardado y genera resultados, incluidas operaciones aritméticas o lógicas." },
      { k: "g", t: "Hardware", v: "equipos o dispositivos físicos considerados en forma independiente de su capacidad o función, que forman un computador o sus componentes periféricos, de manera que pueden incluir herramientas, implementos, instrumentos, conexiones, ensamblajes, componentes y partes." },
      { k: "h", t: "Firmware", v: "programa o segmento de programa incorporado de manera permanente en algún componente de hardware." },
      { k: "i", t: "Software", v: "información organizada en forma de programas de computación, procedimientos y documentación asociados, concebidos para realizar la operación de un sistema, de manera que pueda proveer de instrucciones a los computadores así como de data expresada en cualquier forma, con el objeto de que éstos realicen funciones específicas." },
      { k: "j", t: "Programa", v: "plan, rutina o secuencia de instrucciones utilizados para realizar un trabajo en particular o resolver un problema dado a través de un computador." },
      { k: "k", t: "Procesamiento de data o de información", v: "realización sistemática de operaciones sobre data o sobre información, tales como manejo, fusión, organización o cómputo." },
      { k: "l", t: "Seguridad", v: "Condición que resulta del establecimiento y mantenimiento de medidas de protección que garanticen un estado de inviolabilidad de influencias o de actos hostiles específicos que puedan propiciar el acceso a la data de personas no autorizadas o que afecten la operatividad de las funciones de un sistema de computación." },
      { k: "m", t: "Virus", v: "programa o segmento de programa indeseado que se desarrolla incontroladamente y que genera efectos destructivos o perturbadores en un programa o componente del sistema." },
      { k: "n", t: "Tarjeta inteligente", v: "rótulo, cédula o carnet que se utiliza como instrumento de identificación, de acceso a un sistema, de pago o de crédito y que contiene data, información o ambas, de uso restringido sobre el usuario autorizado para portarla." },
      { k: "ñ", t: "Contraseña (password)", v: "secuencia alfabética, numérica o combinación de ambas, protegida por reglas de confidencialidad utilizada para verificar la autenticidad de la autorización expedida a un usuario para acceder a la data o a la información contenidas en un sistema." },
      { k: "o", t: "Mensaje de datos", v: "cualquier pensamiento, idea, imagen, audio, data o información, expresados en un lenguaje conocido que puede ser explícito o secreto (encriptado), preparados dentro de un formato adecuado para ser transmitido por un sistema de comunicaciones." },
    ],
    kw: ["definiciones", "glosario", "tecnología", "sistema", "data", "información", "documento", "computador", "hardware", "firmware", "software", "programa", "seguridad", "virus", "tarjeta inteligente", "contraseña", "password", "mensaje de datos"],
  },
  {
    n: 3, titulo: "Extraterritorialidad",
    p: ["Cuando alguno de los delitos previstos en la presente ley se cometa fuera del territorio de la República, el sujeto activo quedará sujeto a sus disposiciones si dentro del territorio de la República se hubieren producido efectos del hecho punible y el responsable no ha sido juzgado por el mismo hecho o ha evadido el juzgamiento o la condena por tribunales extranjeros."],
    kw: ["extraterritorialidad", "extranjero", "territorio", "jurisdicción", "ámbito"],
  },
  {
    n: 4, titulo: "Sanciones",
    p: [
      "Las sanciones por los delitos previstos en esta ley serán principales y accesorias.",
      "Las sanciones principales concurrirán con las accesorias y ambas podrán también concurrir entre sí, de acuerdo con las circunstancias particulares del delito del cual se trate, en los términos indicados en la presente ley.",
    ],
    kw: ["sanciones", "penas", "principales", "accesorias", "concurrencia"],
  },
  {
    n: 5, titulo: "Responsabilidad de las personas jurídicas",
    p: ["Cuando los delitos previstos en esta Ley fuesen cometidos por los gerentes, administradores, directores o dependientes de una persona jurídica, actuando en su nombre o representación, éstos responderán de acuerdo con su participación culpable. La persona jurídica será sancionada en los términos previstos en esta Ley, en los casos en que el hecho punible haya sido cometido por decisión de sus órganos, en el ámbito de su actividad, con sus recursos sociales o en su interés exclusivo o preferente."],
    kw: ["personas jurídicas", "empresas", "responsabilidad", "gerentes", "administradores", "directores", "representación"],
  },
  {
    n: 6, titulo: "Acceso indebido",
    p: ["El que sin la debida autorización o excediendo la que hubiere obtenido, acceda, intercepte, interfiera o use un sistema que utilice tecnologías de información, será penado con prisión de uno a cinco años y multa de diez a cincuenta unidades tributarias."],
    pena: { prision: "1 a 5 años", multa: "10 a 50 U.T." },
    kw: ["acceso indebido", "hacking", "hackeo", "intrusión", "acceso no autorizado", "interceptar", "sistema"],
  },
  {
    n: 7, titulo: "Sabotaje o daño a sistemas",
    p: [
      "El que destruya, dañe, modifique o realice cualquier acto que altere el funcionamiento o inutilice un sistema que utilice tecnologías de información o cualquiera de los componentes que lo conforman, será penado con prisión de cuatro a ocho años y multa de cuatrocientas a ochocientas unidades tributarias.",
      "Incurrirá en la misma pena quien destruya, dañe, modifique o inutilice la data o la información contenida en cualquier sistema que utilice tecnologías de información o en cualquiera de sus componentes. La pena será de cinco a diez años de prisión y multa de quinientas a mil unidades tributarias, si los efectos indicados en el presente artículo se realizaren mediante la creación, introducción o transmisión, por cualquier medio, de un virus o programa análogo.",
    ],
    pena: { prision: "4 a 8 años", multa: "400 a 800 U.T." },
    kw: ["sabotaje", "daño", "destruir", "virus", "malware", "alterar", "inutilizar", "data"],
  },
  {
    n: 8, titulo: "Sabotaje o daño culposos",
    p: ["Si el delito previsto en el artículo anterior se cometiere por imprudencia, negligencia, impericia o inobservancia de las normas establecidas, se aplicará la pena correspondiente según el caso, con una reducción entre la mitad y dos tercios."],
    kw: ["culposo", "imprudencia", "negligencia", "impericia", "inobservancia", "reducción"],
  },
  {
    n: 9, titulo: "Acceso indebido o sabotaje a sistemas protegidos",
    p: ["Las penas previstas en los artículos anteriores se aumentarán entre una tercera parte y la mitad cuando los hechos allí previstos o sus efectos recaigan sobre cualquiera de los componentes de un sistema que utilice tecnologías de información protegido por medidas de seguridad, que esté destinado a funciones públicas o que contenga información personal o patrimonial de uso restringido sobre personas o grupos de personas naturales o jurídicas."],
    kw: ["sistemas protegidos", "seguridad", "funciones públicas", "agravante", "información restringida"],
  },
  {
    n: 10, titulo: "Posesión de equipos o prestación de servicios de sabotaje",
    p: ["El que, con el propósito de destinarlos a vulnerar o eliminar la seguridad de cualquier sistema que utilice tecnologías de información, importe, fabrique, posea, distribuya, venda o utilice equipos o dispositivos; o el que ofrezca o preste servicios destinados a cumplir los mismos fines, será penado con prisión de tres a seis años y multa de trescientas a seiscientas unidades tributarias."],
    pena: { prision: "3 a 6 años", multa: "300 a 600 U.T." },
    kw: ["posesión de equipos", "servicios de sabotaje", "herramientas", "vulnerar", "seguridad", "dispositivos"],
  },
  {
    n: 11, titulo: "Espionaje informático",
    p: [
      "El que indebidamente obtenga, revele o difunda la data o información contenidas en un sistema que utilice tecnologías de información o en cualquiera de sus componentes, será penado con prisión de cuatro a ocho años y multa de cuatrocientas a ochocientas unidades tributarias. La pena se aumentará de un tercio a la mitad, si el delito previsto en el presente artículo se cometiere con el fin de obtener algún tipo de beneficio para sí o para otro.",
      "El aumento será de la mitad a dos tercios, si se pusiere en peligro la seguridad del Estado, la confiabilidad de la operación de las instituciones afectadas o resultare algún daño para las personas naturales o jurídicas como consecuencia de la revelación de las informaciones de carácter reservado.",
    ],
    pena: { prision: "4 a 8 años", multa: "400 a 800 U.T." },
    kw: ["espionaje", "espionaje informático", "revelar", "difundir", "información reservada", "seguridad del Estado"],
  },
  {
    n: 12, titulo: "Falsificación de documentos",
    p: ["El que, a través de cualquier medio, modifique o elimine un documento que se encuentre incorporado a un sistema que utilice tecnologías de información; o cree, modifique o elimine datos del mismo; o incorpore a dicho sistema un documento inexistente, será penado con prisión de tres a seis años y multa de trescientas a seiscientas unidades tributarias. Cuando el agente hubiere actuado con el fin de procurar para sí o para otro algún tipo de beneficio, la pena se aumentará entre un tercio y la mitad. El aumento será de la mitad a dos tercios si del hecho resultare un perjuicio para otro."],
    pena: { prision: "3 a 6 años", multa: "300 a 600 U.T." },
    kw: ["falsificación", "documentos", "falsificar", "documento inexistente", "alterar datos"],
  },
  {
    n: 13, titulo: "Hurto",
    p: ["El que a través del uso de tecnologías de información, acceda, intercepte, interfiera, manipule o use de cualquier forma un sistema para apoderarse de bienes o valores tangibles o intangibles de carácter patrimonial sustrayéndolos a su tenedor, con el fin de procurarse un provecho económico para sí o para otro, será sancionado con prisión de dos a seis años y multa de doscientas a seiscientas unidades tributarias."],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["hurto", "robo", "sustraer", "apoderarse", "bienes", "valores", "patrimonial"],
  },
  {
    n: 14, titulo: "Fraude",
    p: ["El que, a través del uso indebido de tecnologías de información, valiéndose de cualquier manipulación en sistemas o cualquiera de sus componentes o en la data o información en ellos contenida, consiga insertar instrucciones falsas o fraudulentas que produzcan un resultado que permita obtener un provecho injusto en perjuicio ajeno, será penado con prisión de tres a siete años y multa de trescientas a setecientas unidades tributarias."],
    pena: { prision: "3 a 7 años", multa: "300 a 700 U.T." },
    kw: ["fraude", "estafa", "phishing", "instrucciones falsas", "provecho injusto", "manipulación"],
  },
  {
    n: 15, titulo: "Obtención indebida de bienes o servicios",
    p: ["El que, sin autorización para portarlos, utilice una tarjeta inteligente ajena o instrumento destinado a los mismos fines, o el que utilice indebidamente tecnologías de información para requerir la obtención de cualquier efecto, bien o servicio o para proveer su pago sin erogar o asumir el compromiso de pago de la contraprestación debida, será castigado con prisión de dos a seis años y multa de doscientas a seiscientas unidades tributarias."],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["obtención indebida", "bienes", "servicios", "tarjeta ajena", "pago", "contraprestación"],
  },
  {
    n: 16, titulo: "Manejo fraudulento de tarjetas inteligentes o instrumentos análogos",
    p: ["El que por cualquier medio, cree, capture, grabe, copie, altere, duplique o elimine la data o información contenidas en una tarjeta inteligente o en cualquier instrumento destinado a los mismos fines; o el que, mediante cualquier uso indebido de tecnologías de información, cree, duplique o altere la data o información en un sistema con el objeto de incorporar usuarios, cuentas, registros o consumos inexistentes o modifique la cuantía de éstos, será penado con prisión de cinco a diez años y multa de quinientas a mil unidades tributarias. En la misma pena incurrirá quien, sin haber tomado parte en los hechos anteriores, adquiera, comercialice, posea, distribuya, venda o realice cualquier tipo de intermediación de tarjetas inteligentes o instrumentos destinados al mismo fin, o de la data o información contenidas en ellos o en un sistema."],
    pena: { prision: "5 a 10 años", multa: "500 a 1000 U.T." },
    kw: ["tarjetas inteligentes", "clonación", "skimming", "duplicar", "manejo fraudulento", "cuentas", "registros"],
  },
  {
    n: 17, titulo: "Apropiación de tarjetas inteligentes o instrumentos análogos",
    p: ["El que se apropie de una tarjeta inteligente o instrumento destinado a los mismos fines, que se hayan perdido, extraviado o hayan sido entregados por equivocación, con el fin de retenerlos, usarlos, venderlos o transferirlos a persona distinta del usuario autorizado o entidad emisora, será penado con prisión de uno a cinco años y multa de diez a cincuenta unidades tributarias. La misma pena se impondrá a quien adquiera o reciba la tarjeta o instrumento a que se refiere el presente artículo."],
    pena: { prision: "1 a 5 años", multa: "10 a 50 U.T." },
    kw: ["apropiación", "tarjetas", "extraviado", "perdido", "retener", "transferir"],
  },
  {
    n: 18, titulo: "Provisión indebida de bienes o servicios",
    p: ["El que, a sabiendas de que una tarjeta inteligente o instrumento destinado a los mismos fines, han sido falsificados, alterados, se encuentran vencidos o revocados o han sido indebidamente obtenidos o retenidos, provea a quien los presente, de dinero, efectos, bienes o servicios o cualquier otra cosa de valor económico, será penado con prisión de dos a seis años y multa de doscientas a seiscientas unidades tributarias."],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["provisión indebida", "bienes", "servicios", "tarjeta falsificada", "vencidos", "revocados"],
  },
  {
    n: 19, titulo: "Posesión de equipo para falsificaciones",
    p: ["El que sin estar debidamente autorizado para emitir, fabricar o distribuir tarjetas inteligentes o instrumentos análogos, reciba, adquiera, posea, transfiera, comercialice, distribuya, venda, controle o custodie cualquier equipo de fabricación de tarjetas inteligentes o de instrumentos destinados a los mismos fines o cualquier equipo o componente que capture, grabe, copie o transmita la data o información de dichas tarjetas o instrumentos, será penado con prisión de tres a seis años y multa de trescientas a seiscientas unidades tributarias."],
    pena: { prision: "3 a 6 años", multa: "300 a 600 U.T." },
    kw: ["posesión de equipo", "falsificaciones", "fabricación", "tarjetas", "equipo", "capturar"],
  },
  {
    n: 20, titulo: "Violación de la privacidad de la data o información de carácter personal",
    p: ["El que por cualquier medio se apodere, utilice, modifique o elimine, sin el consentimiento de su dueño, la data o información personales de otro o sobre las cuales tenga interés legítimo, que estén incorporadas en un computador o sistema que utilice tecnologías de información, será penado con prisión de dos a seis años y multa de doscientas a seiscientas unidades tributarias. La pena se incrementará de un tercio a la mitad si como consecuencia de los hechos anteriores resultare un perjuicio para el titular de la data o información o para un tercero."],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["privacidad", "datos personales", "data personal", "consentimiento", "información personal"],
  },
  {
    n: 21, titulo: "Violación de la privacidad de las comunicaciones",
    p: ["Incurrirá en la pena de dos a seis años de prisión y multa de doscientas a seiscientas unidades tributarias, el que, mediante el uso de tecnologías de información, acceda, capture, intercepte, interfiera, reproduzca, modifique, desvíe o elimine cualquier mensaje de datos o señal de transmisión o comunicación ajenos."],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["privacidad", "comunicaciones", "interceptar", "mensaje de datos", "señal", "transmisión"],
  },
  {
    n: 22, titulo: "Revelación indebida de data o información de carácter personal",
    p: [
      "El que revele, difunda o ceda, en todo o en parte, los hechos descubiertos, las imágenes, el audio o, en general, la data o información obtenidos por alguno de los medios indicados en los artículos precedentes, aún cuando el autor no hubiese tomado parte en la comisión de dichos delitos, será sancionado con prisión de dos a seis años y multa de doscientas a seiscientas unidades tributarias.",
      "Si la revelación, difusión o cesión se hubieren realizado con un fin de lucro o si resultare algún perjuicio para otro, la pena se aumentará de un tercio a la mitad.",
    ],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["revelación indebida", "difundir", "ceder", "data personal", "fin de lucro", "imágenes", "audio"],
  },
  {
    n: 23, titulo: "Difusión o exhibición de material pornográfico",
    p: ["El que por cualquier medio que involucre el uso de tecnologías de información, exhiba, difunda, transmita o venda libremente, de modo que pueda ser accedido por niños o adolescentes, material pornográfico o reservado a personas adultas, será sancionado con prisión de dos a seis años y multa de doscientas a seiscientas unidades tributarias."],
    pena: { prision: "2 a 6 años", multa: "200 a 600 U.T." },
    kw: ["pornografía", "material pornográfico", "niños", "adolescentes", "menores", "difusión", "exhibición"],
  },
  {
    n: 24, titulo: "Exhibición pornográfica de niños o adolescentes",
    p: ["El que por cualquier medio que involucre el uso de tecnologías de información, utilice a la persona o imagen de un niño o adolescente con fines exhibicionistas o pornográficos, será penado con prisión de cuatro a ocho años y multa de cuatrocientas a ochocientas unidades tributarias."],
    pena: { prision: "4 a 8 años", multa: "400 a 800 U.T." },
    kw: ["exhibición pornográfica", "niños", "adolescentes", "menores", "imagen", "exhibicionistas"],
  },
  {
    n: 25, titulo: "Apropiación de propiedad intelectual",
    p: ["El que, sin autorización de su propietario y con el fin de obtener algún provecho económico, reproduzca, modifique, copie, distribuya o divulgue un software u otra obra del intelecto que haya obtenido mediante el acceso a cualquier sistema que utilice tecnologías de información, será sancionado con prisión de uno a cinco años y multa de cien a quinientas unidades tributarias."],
    pena: { prision: "1 a 5 años", multa: "100 a 500 U.T." },
    kw: ["propiedad intelectual", "software", "piratería", "copiar", "reproducir", "obra", "derechos de autor"],
  },
  {
    n: 26, titulo: "Oferta engañosa",
    p: ["El que ofrezca, comercialice o provea de bienes o servicios mediante el uso de tecnologías de información y haga alegaciones falsas o atribuya características inciertas a cualquier elemento de dicha oferta de modo que pueda resultar algún perjuicio para los consumidores, será sancionado con prisión de uno a cinco años y multa de cien a quinientas unidades tributarias, sin perjuicio de la comisión de un delito más grave."],
    pena: { prision: "1 a 5 años", multa: "100 a 500 U.T." },
    kw: ["oferta engañosa", "publicidad falsa", "consumidores", "alegaciones falsas", "comercio electrónico"],
  },
  {
    n: 27, titulo: "Agravantes",
    p: ["La pena correspondiente a los delitos previstos en la presente Ley se incrementará entre un tercio y la mitad:"],
    items: [
      "Si para la realización del hecho se hubiere hecho uso de alguna contraseña ajena indebidamente obtenida, quitada, retenida o que se hubiere perdido.",
      "Si el hecho hubiere sido cometido mediante el abuso de la posición de acceso a data o información reservada o al conocimiento privilegiado de contraseñas en razón del ejercicio de un cargo o función.",
    ],
    kw: ["agravantes", "contraseña ajena", "abuso", "cargo", "función", "incremento"],
  },
  {
    n: 28, titulo: "Agravante especial",
    p: ["La sanción aplicable a las personas jurídicas por los delitos cometidos en las condiciones señaladas en el artículo 5 de esta Ley, será únicamente de multa, pero por el doble del monto establecido para el referido delito."],
    kw: ["agravante especial", "personas jurídicas", "multa doble", "empresas"],
  },
  {
    n: 29, titulo: "Penas accesorias",
    p: ["Además de las penas principales previstas en los capítulos anteriores, se impondrán, sin perjuicio de las establecidas en el Código Penal, las accesorias siguientes:"],
    items: [
      "El comiso de equipos, dispositivos, instrumentos, materiales, útiles, herramientas y cualquier otro objeto que hayan sido utilizados para la comisión de los delitos previstos en los artículos 10 y 19 de la presente ley.",
      "El trabajo comunitario por el término de hasta tres años en los casos de los delitos previstos en los artículos 6 y 8 de esta Ley.",
      "La inhabilitación para el ejercicio de funciones o empleos públicos, para el ejercicio de la profesión, arte o industria, o para laborar en instituciones o empresas del ramo por un período de hasta tres (3) años después de cumplida o conmutada la sanción principal cuando el delito se haya cometido con abuso de la posición de acceso a data o información reservadas o al conocimiento privilegiado de contraseñas en razón del ejercicio de un cargo o función públicos, del ejercicio privado de una profesión u oficio o del desempeño en una institución o empresa privadas, respectivamente.",
      "La suspensión del permiso, registro o autorización para operar o para el ejercicio de cargos directivos y de representación de personas jurídicas vinculadas con el uso de tecnologías de información hasta por el período de tres (3) años después de cumplida o conmutada la sanción principal, si para cometer el delito el agente se hubiere valido o hubiere hecho figurar a una persona jurídica.",
    ],
    kw: ["penas accesorias", "comiso", "trabajo comunitario", "inhabilitación", "suspensión", "Código Penal"],
  },
  {
    n: 30, titulo: "Divulgación de la sentencia condenatoria",
    p: ["El Tribunal podrá disponer, además, la publicación o difusión de la sentencia condenatoria por el medio que considere más idóneo."],
    kw: ["divulgación", "sentencia", "condenatoria", "publicación", "tribunal"],
  },
  {
    n: 31, titulo: "Indemnización Civil Especial",
    p: [
      "En los casos de condena por cualquiera de los delitos previstos en los Capítulos II y V de esta Ley, el Juez impondrá en la sentencia una indemnización en favor de la víctima por un monto equivalente al daño causado.",
      "Para la determinación del monto de la indemnización acordada, el Juez requerirá del auxilio de expertos.",
    ],
    kw: ["indemnización", "civil", "víctima", "daño", "expertos", "reparación"],
  },
  {
    n: 32, titulo: "Vigencia",
    p: ["La presente Ley entrará en vigencia, treinta días después de su publicación en la Gaceta Oficial de la República Bolivariana de Venezuela."],
    kw: ["vigencia", "entrada en vigor", "publicación", "Gaceta Oficial", "treinta días"],
  },
  {
    n: 33, titulo: "Derogatoria",
    p: ["Se deroga cualquier disposición que colida con la presente Ley."],
    kw: ["derogatoria", "derogar", "disposición", "colida"],
  },
];

/* Enriquecer cada artículo con su Título y Capítulo */
(function () {
  for (const a of ARTICULOS) {
    for (const t of TITULOS) {
      if (a.n >= t.desde && a.n <= t.hasta) {
        a.tituloId = t.id;
        a.tituloNombre = t.nombre;
        if (t.capitulos) {
          for (const c of t.capitulos) {
            if (a.n >= c.desde && a.n <= c.hasta) {
              a.capId = c.id;
              a.capNombre = c.nombre;
            }
          }
        }
      }
    }
    a.esDelito = a.n >= 6 && a.n <= 26;
  }
})();
