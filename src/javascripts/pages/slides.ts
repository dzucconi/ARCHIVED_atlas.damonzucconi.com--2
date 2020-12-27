import { request } from "../lib/request";
import { DOM } from "../lib/dom";
import { mapCursorToMax } from "map-cursor-to-max";

const SLIDES_QUERY = `
  query SlidesQuery($id: ID!, $page: Int, $per: Int) {
    root: object {
      ... on Collection {
        collection(id: $id) {
          id
          slug
          title
          counts {
            contents
          }
          contents(page: $page, per: $per) {
            id
            entity {
              kind: __typename
              ... on Text {
                id
                name
                body
              }
              ... on Link {
                id
                name
                url
              }
              ... on Collection {
                id
                slug
                name
              }
              ... on Image {
                id
                name
                placeholder: resized(width: 50, height: 50, blur: 10) {
                  urls {
                    src: _1x
                  }
                }
                thumb: resized(width: 1400, height: 1400) {
                  width
                  height
                  urls {
                    _1x
                    _2x
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CONFIG = {
  per: 25,
  speed: 5000,
};

const STATE = {
  id: null,
  cursor: -1,
  page: 1,
  contents: [],
};

const render = ({
  id,
  collection,
  entity,
  index,
}: {
  id: string;
  collection: any;
  entity: any;
  index: number;
}) => {
  DOM.root.innerHTML = `
    <div class="Slides">
      ${[...new Array(collection.counts.contents)]
        .map((_, i) => {
          return `<div class="Slides__indicator ${
            i < index && `Slides__indicator--past`
          } ${i === index && `Slides__indicator--active`}">
            <div class="Slides__progress"></div>
          </div>`;
        })
        .join("")}
    </div>

    <div class="Slide">
      <div class="Slide__content" style="background-image: url('${
        entity.placeholder.urls.src
      }')">
      ${(() => {
        switch (entity.kind) {
          case "Image":
            return `
              <img
                class="Slide__image"
                src="${entity.thumb.urls._1x}"
                srcset="${entity.thumb.urls._1x} 1x, ${entity.thumb.urls._2x} 2x"
                width="${entity.thumb.width}"
                height="${entity.thumb.height}"
              />
          `;
          case "Text":
            return `<div class="Slide__text">${entity.body}</div>`;
          case "Link":
            return `<div class="Slide__link">${entity.name}</div>`;
          case "Collection":
            return `<div class="Slide__collection">${entity.name}</div>`;
        }
      })()}
      </div>
    </div>
  `;
};

const getContents = async () => {
  const { data, errors } = await request({
    query: SLIDES_QUERY,
    variables: { id: STATE.id, page: STATE.page, per: CONFIG.per },
  });

  if (errors) {
    const [error] = errors;
    if (error.extensions.code === "NOT_FOUND") {
      DOM.root.innerHTML = "404";
      return;
    }
    DOM.root.innerHTML = error.message;
    throw error;
  }

  STATE.contents = [...STATE.contents, ...data.root.collection.contents];

  return data;
};

const getContent = async (index: number) => {
  const content = STATE.contents[index];

  if (content) {
    return content;
  }

  STATE.page++;
  await getContents();

  return STATE.contents[index];
};

export const slides = async ({ id }: { id: string }) => {
  DOM.root.innerHTML = `<div class="Loading"></div>`;
  document.title = "... / Atlas";

  STATE.id = id;

  const {
    root: {
      collection,
      collection: { title, counts },
    },
  } = await getContents();

  document.title = `${title} / Atlas`;

  const step = async () => {
    STATE.cursor++;
    const index = mapCursorToMax(STATE.cursor, counts.contents);
    const { entity } = await getContent(index);
    render({ id, collection, entity, index });
    setTimeout(step, CONFIG.speed);
  };

  step();
};
