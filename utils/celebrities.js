// Curated list of verified celebrities with reliable Wikipedia images
export const celebrityList = [
  "Tom Hanks",
  "Meryl Streep",
  "Leonardo DiCaprio",
  "Jennifer Lawrence",
  "Johnny Depp",
  "Angelina Jolie",
  "Brad Pitt",
  "Scarlett Johansson",
  "Tom Cruise",
  "Denzel Washington",
  "Sandra Bullock",
  "Will Smith",
  "Kate Winslet",
  "Matt Damon",
  "Natalie Portman",
  "Al Pacino",
  "Nicole Kidman",
  "Robert De Niro",
  "Cate Blanchett",
  "Chris Hemsworth",
  "Emma Stone",
  "Harrison Ford",
  "Margot Robbie",
  "Ryan Gosling",
  "Gal Gadot",
  "Keanu Reeves",
  "Charlize Theron",
  "Tom Hardy",
  "Saoirse Ronan",
  "Timothée Chalamet",
  "Zendaya",
  "Oscar Isaac",
  "Anya Taylor-Joy",
  "Rami Malek",
  "Brie Larson",
  "Michael B. Jordan",
  "Joaquin Phoenix",
  "Florence Pugh",
  "Andrew Garfield",
  "Dakota Johnson",
  "Robert Pattinson",
  "Kristen Stewart",
  "Christian Bale",
  "Anne Hathaway",
  "Ryan Reynolds",
  "Blake Lively",
  "Chris Evans",
  "Sebastian Stan",
  "Benedict Cumberbatch",
  "Tom Hiddleston",
  "Mark Ruffalo",
  "Jeremy Renner",
  "Tom Holland",
  "Zoe Saldana",
  "Michelle Yeoh",
  "Jackie Chan",
  "Viola Davis",
  "Octavia Spencer",
  "Sofia Vergara",
  "Penélope Cruz",
  "Javier Bardem",
  "Pedro Pascal",
  "Diego Luna",
  "Dev Patel",
  "Riz Ahmed",
  "Toni Collette",
  "Elisabeth Moss",
  "Allison Janney",
  "Mahershala Ali",
  "Paul Dano",
  "Vanessa Kirby",
  "Thomasin McKenzie",
  "Lucas Hedges",
  "Emily Blunt",
  "Jake Gyllenhaal",
  "Paul Rudd",
  "Mark Hamill",
  "Daisy Ridley",
  "Adam Driver",
  "John Boyega",
];

// At server startup, filter celebrities to only those with a valid image
import { getCelebrityImage } from "./wikipedia";
let filteredCelebrityList = [];
let filteringPromise = null;

export async function getFilteredCelebrityList() {
  if (filteredCelebrityList.length > 0) return filteredCelebrityList;
  if (filteringPromise) return filteringPromise;
  filteringPromise = (async () => {
    const results = await Promise.all(
      celebrityList.map(async (name) => {
        const img = await getCelebrityImage(name);
        return img ? name : null;
      }),
    );
    filteredCelebrityList = results.filter(Boolean);
    return filteredCelebrityList;
  })();
  return filteringPromise;
}

export async function getRandomCelebrities(count = 25) {
  const list = await getFilteredCelebrityList();
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getRandomCelebrity() {
  const list = await getFilteredCelebrityList();
  return list[Math.floor(Math.random() * list.length)];
}