import { request } from "../lib/request";
import { DOM } from "../lib/dom";

const COLLECTION_CONTENT_QUERY = `
  query CollectionContentQuery($collectionId: ID!, $id: ID!) {
    root: object {
      ... on Collection {
        collection(id: $collectionId) {
          id
          slug
          title
          content(id: $id) {
            id
            next {
              id
            }
            previous {
              id
            }
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
                originalUrl: url
                width
                height
                thumb: resized(width: 900, height: 900, quality: 85) {
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

export const show = ({
  collectionId,
  id,
}: {
  collectionId: string;
  id: number;
}) => {
  DOM.root.innerHTML = `<div class="Loading" />`;
  document.title = "... / Atlas";

  request({
    query: COLLECTION_CONTENT_QUERY,
    variables: { collectionId, id },
  }).then(({ data, errors }) => {
    if (errors) {
      const [error] = errors;

      if (error.extensions.code === "NOT_FOUND") {
        DOM.root.innerHTML = "404";
        return;
      }

      DOM.root.innerHTML = error.message;
      throw error;
    }

    const {
      root: {
        collection,
        collection: {
          title,
          content,
          content: { entity },
        },
      },
    } = data;

    document.title = `${entity.name} / ${title} / Atlas`;

    DOM.root.innerHTML = `
      <div class="Content">
        <nav class="Nav">
          ${
            content.previous
              ? `<a href="/${collection.slug}/x/${content.previous.id}">previous</a>`
              : ""
          }
          <a href="/${collection.slug}">up</a>
          ${
            content.next
              ? `<a href="/${collection.slug}/x/${content.next.id}">next</a>`
              : ""
          }
        </nav>

        <div class="Content__content">
          ${(() => {
            switch (entity.kind) {
              case "Image":
                return `
                  <a href="${entity.originalUrl}" target="_blank">
                    <img
                      class="Content__image"
                      src="${entity.thumb.urls._1x}"
                      srcset="${entity.thumb.urls._1x} 1x, ${entity.thumb.urls._2x} 2x"
                      width="${entity.thumb.width}"
                      height="${entity.thumb.height}"
                    />
                  </a>

                  <a class="Content__download" href="${entity.originalUrl}" target="_blank">
                    ${entity.name} (${entity.width} &times; ${entity.height})
                  </a>
                `;
              case "Text":
                return `<div class="Content__text">${entity.body}</div>`;
              case "Link":
                return `<a class="Content__link" href="${entity.url}" target="_blank">${entity.url}</a>`;
              case "Collection":
                return `<a class="Content__collection" href="/${entity.slug}">${entity.name}</a>`;
            }
          })()}
        </div>
      </div>
    `;
  });
};
