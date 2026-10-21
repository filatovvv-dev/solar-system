export interface Moon {
  name: string;
  nameRu: string;
  radius: number; // km
  distance: number; // from planet in km
  orbitalPeriod: number; // days
  color: string;
}

export interface CelestialBody {
  name: string;
  nameRu: string;
  type: 'star' | 'planet' | 'dwarf' | 'asteroid_belt' | 'kuiper_belt' | 'oort_cloud';
  radius: number; // km
  distanceFromSun: number; // million km (semi-major axis)
  orbitalPeriod: number; // Earth days
  eccentricity: number;
  color: string;
  description?: string;
  moons?: Moon[];
}

export const SUN: CelestialBody = {
  name: 'Sun',
  nameRu: 'Солнце',
  type: 'star',
  radius: 696340,
  distanceFromSun: 0,
  orbitalPeriod: 0,
  eccentricity: 0,
  color: '#FDB813',
  description: 'Звезда в центре Солнечной системы. Жёлтый карлик спектрального класса G2V.'
};

export const PLANETS: CelestialBody[] = [
  {
    name: 'Mercury',
    nameRu: 'Меркурий',
    type: 'planet',
    radius: 2439.7,
    distanceFromSun: 57.9,
    orbitalPeriod: 88,
    eccentricity: 0.2056,
    color: '#A0522D',
    description: 'Самая маленькая и ближайшая к Солнцу планета.'
  },
  {
    name: 'Venus',
    nameRu: 'Венера',
    type: 'planet',
    radius: 6051.8,
    distanceFromSun: 108.2,
    orbitalPeriod: 224.7,
    eccentricity: 0.0068,
    color: '#DEB887',
    description: 'Вторая планета от Солнца, самая горячая планета в Солнечной системе.'
  },
  {
    name: 'Earth',
    nameRu: 'Земля',
    type: 'planet',
    radius: 6371,
    distanceFromSun: 149.6,
    orbitalPeriod: 365.25,
    eccentricity: 0.0167,
    color: '#4169E1',
    description: 'Третья планета от Солнца, единственная известная планета с жизнью.',
    moons: [
      { name: 'Moon', nameRu: 'Луна', radius: 1737.4, distance: 384400, orbitalPeriod: 27.3, color: '#C0C0C0' }
    ]
  },
  {
    name: 'Mars',
    nameRu: 'Марс',
    type: 'planet',
    radius: 3389.5,
    distanceFromSun: 227.9,
    orbitalPeriod: 687,
    eccentricity: 0.0934,
    color: '#CD5C5C',
    description: 'Четвёртая планета от Солнца, известна как Красная планета.',
    moons: [
      { name: 'Phobos', nameRu: 'Фобос', radius: 11.267, distance: 9376, orbitalPeriod: 0.319, color: '#8B7355' },
      { name: 'Deimos', nameRu: 'Деймос', radius: 6.2, distance: 23460, orbitalPeriod: 1.263, color: '#A0826D' }
    ]
  },
  {
    name: 'Jupiter',
    nameRu: 'Юпитер',
    type: 'planet',
    radius: 69911,
    distanceFromSun: 778.5,
    orbitalPeriod: 4332.59,
    eccentricity: 0.0489,
    color: '#DAA520',
    description: 'Пятая и крупнейшая планета Солнечной системы, газовый гигант.',
    moons: [
      { name: 'Io', nameRu: 'Ио', radius: 1821.6, distance: 421700, orbitalPeriod: 1.769, color: '#FFFF00' },
      { name: 'Europa', nameRu: 'Европа', radius: 1560.8, distance: 671034, orbitalPeriod: 3.551, color: '#F5F5DC' },
      { name: 'Ganymede', nameRu: 'Ганимед', radius: 2634.1, distance: 1070412, orbitalPeriod: 7.155, color: '#A9A9A9' },
      { name: 'Callisto', nameRu: 'Каллисто', radius: 2410.3, distance: 1882709, orbitalPeriod: 16.689, color: '#696969' }
    ]
  },
  {
    name: 'Saturn',
    nameRu: 'Сатурн',
    type: 'planet',
    radius: 58232,
    distanceFromSun: 1433.5,
    orbitalPeriod: 10759.22,
    eccentricity: 0.0565,
    color: '#F4A460',
    description: 'Шестая планета от Солнца, известна своими кольцами.',
    moons: [
      { name: 'Titan', nameRu: 'Титан', radius: 2574.7, distance: 1221870, orbitalPeriod: 15.945, color: '#DAA520' },
      { name: 'Enceladus', nameRu: 'Энцелад', radius: 252.1, distance: 237948, orbitalPeriod: 1.37, color: '#FFFFFF' },
      { name: 'Mimas', nameRu: 'Мимас', radius: 198.2, distance: 185539, orbitalPeriod: 0.942, color: '#D3D3D3' },
      { name: 'Rhea', nameRu: 'Рея', radius: 763.8, distance: 527108, orbitalPeriod: 4.518, color: '#C0C0C0' }
    ]
  },
  {
    name: 'Uranus',
    nameRu: 'Уран',
    type: 'planet',
    radius: 25362,
    distanceFromSun: 2872.5,
    orbitalPeriod: 30688.5,
    eccentricity: 0.0457,
    color: '#AFEEEE',
    description: 'Седьмая планета от Солнца, ледяной гигант с наклоном оси 98°.',
    moons: [
      { name: 'Titania', nameRu: 'Титания', radius: 788.4, distance: 435910, orbitalPeriod: 8.706, color: '#D3D3D3' },
      { name: 'Oberon', nameRu: 'Оберон', radius: 761.4, distance: 583520, orbitalPeriod: 13.463, color: '#A9A9A9' },
      { name: 'Miranda', nameRu: 'Миранда', radius: 235.8, distance: 129390, orbitalPeriod: 1.413, color: '#C0C0C0' },
      { name: 'Ariel', nameRu: 'Ариэль', radius: 578.9, distance: 190900, orbitalPeriod: 2.52, color: '#DCDCDC' }
    ]
  },
  {
    name: 'Neptune',
    nameRu: 'Нептун',
    type: 'planet',
    radius: 24622,
    distanceFromSun: 4495.1,
    orbitalPeriod: 60182,
    eccentricity: 0.0113,
    color: '#4169E1',
    description: 'Восьмая и самая дальняя планета Солнечной системы, ледяной гигант.',
    moons: [
      { name: 'Triton', nameRu: 'Тритон', radius: 1353.4, distance: 354759, orbitalPeriod: 5.877, color: '#B0C4DE' },
      { name: 'Proteus', nameRu: 'Протей', radius: 210, distance: 117647, orbitalPeriod: 1.122, color: '#808080' },
      { name: 'Nereid', nameRu: 'Нереида', radius: 170, distance: 5513400, orbitalPeriod: 360.13, color: '#A9A9A9' }
    ]
  }
];

export const DWARF_PLANETS: CelestialBody[] = [
  {
    name: 'Ceres',
    nameRu: 'Церера',
    type: 'dwarf',
    radius: 473,
    distanceFromSun: 413.7,
    orbitalPeriod: 1682,
    eccentricity: 0.0758,
    color: '#808080',
    description: 'Крупнейший объект в поясе астероидов, карликовая планета.'
  },
  {
    name: 'Pluto',
    nameRu: 'Плутон',
    type: 'dwarf',
    radius: 1188.3,
    distanceFromSun: 5906.4,
    orbitalPeriod: 90560,
    eccentricity: 0.2488,
    color: '#DEB887',
    description: 'Крупнейшая карликовая планета в поясе Койпера.',
    moons: [
      { name: 'Charon', nameRu: 'Харон', radius: 606, distance: 19591, orbitalPeriod: 6.387, color: '#A0A0A0' }
    ]
  },
  {
    name: 'Haumea',
    nameRu: 'Хаумеа',
    type: 'dwarf',
    radius: 816,
    distanceFromSun: 6452,
    orbitalPeriod: 103774,
    eccentricity: 0.1912,
    color: '#F5F5F5',
    description: 'Карликовая планета в поясе Койпера с вытянутой формой.',
    moons: [
      { name: 'Hi\'iaka', nameRu: 'Хииака', radius: 160, distance: 49880, orbitalPeriod: 49.12, color: '#D3D3D3' },
      { name: 'Namaka', nameRu: 'Намака', radius: 85, distance: 25660, orbitalPeriod: 18.28, color: '#C0C0C0' }
    ]
  },
  {
    name: 'Makemake',
    nameRu: 'Макемаке',
    type: 'dwarf',
    radius: 715,
    distanceFromSun: 6783,
    orbitalPeriod: 112897,
    eccentricity: 0.1559,
    color: '#CD853F',
    description: 'Карликовая планета в поясе Койпера, одна из самых ярких после Плутона.'
  },
  {
    name: 'Eris',
    nameRu: 'Эрида',
    type: 'dwarf',
    radius: 1163,
    distanceFromSun: 10120,
    orbitalPeriod: 203830,
    eccentricity: 0.4407,
    color: '#E8E8E8',
    description: 'Самая массивная карликовая планета, находится в рассеянном диске.'
  }
];

export const BELTS = {
  asteroidBelt: {
    nameRu: 'Пояс астероидов',
    innerRadius: 329, // million km
    outerRadius: 479,
    description: 'Область между орбитами Марса и Юпитера, содержащая миллионы астероидов.'
  },
  kuiperBelt: {
    nameRu: 'Пояс Койпера',
    innerRadius: 4500,
    outerRadius: 7500,
    description: 'Область за орбитой Нептуна, содержащая ледяные тела и карликовые планеты.'
  },
  oortCloud: {
    nameRu: 'Облако Оорта',
    innerRadius: 75000,
    outerRadius: 1500000,
    description: 'Гипотетическая сферическая область на границе Солнечной системы, источник долгопериодических комет.'
  }
};
