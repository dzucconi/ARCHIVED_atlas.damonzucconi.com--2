import page from "page";
import qs from "qs";
import { request } from "./lib/request";

const DOM = {
  root: document.getElementById("root"),
};

const COLLECTION_QUERY = `
  query CollectionQuery($id: ID!, $page: Int, $per: Int) {
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
              ...CollectionTextFragment
              ...CollectionLinkFragment
              ...CollectionImageFragment
              ...CollectionCollectionFragment
            }
          }
        }
      }
    }
  }

  fragment CollectionTextFragment on Text {
    id
    name
    body
  }

  fragment CollectionLinkFragment on Link {
    id
    name
    url
  }

  fragment CollectionCollectionFragment on Collection {
    id
    slug
    name
  }

  fragment CollectionImageFragment on Image {
    id
    name
    thumb: resized(width: 200, height: 200) {
      width
      height
      urls {
        _1x
        _2x
      }
    }
  }
`;

const pagination = ({
  total,
  per,
  page,
  interval = 3,
}: {
  total: number;
  page: number;
  per: number;
  interval?: number;
}) => {
  const totalPages = Math.ceil(total / per);
  const prevPage = page > 1 ? page - 1 : page;
  const nextPage = page < totalPages ? page + 1 : page;

  if (totalPages <= 1) return "";

  return `
    <nav class="Nav">
      <a href="?page=1&per=${per}">
        A
      </a>

      <a rel="prev" href="?page=${prevPage}&per=${per}">
        past
      </a>

      ${[...Array(interval)]
        .map((_, i) =>
          page > i + 1
            ? `
            <a href="?page=${page - (i + 1)}&per=${per}">
              ${page - (i + 1)}
            </a>
          `
            : ""
        )
        .filter(Boolean)
        .reverse()
        .join("")}

        <span rel="current">${page}</span>

        ${[...Array(interval)]
          .map((_, i) =>
            totalPages - page + 1 > i + 1
              ? `
              <a href="?page=${page + (i + 1)}&per=${per}">
                ${page + (i + 1)}
              </a>
            `
              : ""
          )
          .filter(Boolean)
          .join("")}

      <a rel="next" href="?page=${nextPage}&per=${per}">
        next
      </a>

      <a href="?page=${totalPages}&per=${per}">
        Ω
      </a>
    </nav>
  `;
};

const index = ({
  id,
  page = "1",
  per = "18",
}: {
  id: string;
  page?: string;
  per?: string;
}) => {
  DOM.root.innerHTML = `<div class="Loading" />`;
  document.title = "... / Atlas";

  request({
    query: COLLECTION_QUERY,
    variables: { id, page: parseInt(page, 10), per: parseInt(per, 10) },
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
        collection: { title, contents },
      },
    } = data;

    document.title = `${title} / Atlas`;

    DOM.root.innerHTML = `
      <div class="Collection">
        ${pagination({
          total: collection.counts.contents,
          page: parseInt(page, 10),
          per: parseInt(per, 10),
        })}

        <div class="Collection__contents">
          ${contents
            .map(({ id, entity }) => {
              return `
                <a class="Collection__content" href="/${
                  collection.slug
                }/x/${id}">
                  ${(() => {
                    switch (entity.kind) {
                      case "Image":
                        return `
                        <img
                          class="Collection__image"
                          src="${entity.thumb.urls._1x}"
                          srcset="${entity.thumb.urls._1x} 1x, ${entity.thumb.urls._2x} 2x"
                          width="${entity.thumb.width}"
                          height="${entity.thumb.height}"
                        />
                      `;
                      case "Text":
                        return `<div class="Collection__text">${entity.body}</div>`;
                      case "Link":
                        return `<div class="Collection__link">${entity.name}</div>`;
                      case "Collection":
                        return `<div class="Collection__collection">${entity.name}</div>`;
                    }
                  })()}
                </a>
              `;
            })
            .join("")}
        </div>

        ${pagination({
          total: collection.counts.contents,
          page: parseInt(page, 10),
          per: parseInt(per, 10),
        })}
      </div>
    `;
  });
};

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
              ...CollectionContentTextFragment
              ...CollectionContentLinkFragment
              ...CollectionContentImageFragment
              ...CollectionContentCollectionFragment
            }
          }
        }
      }
    }
  }

  fragment CollectionContentTextFragment on Text {
    id
    name
    body
  }

  fragment CollectionContentLinkFragment on Link {
    id
    name
    url
  }

  fragment CollectionContentCollectionFragment on Collection {
    id
    slug
    name
  }

  fragment CollectionContentImageFragment on Image {
    id
    name
    thumb: resized(width: 900, height: 900) {
      width
      height
      urls {
        _1x
        _2x
      }
    }
  }
`;

const show = ({ collectionId, id }: { collectionId: string; id: number }) => {
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
                  <img
                    class="Content__image"
                    src="${entity.thumb.urls._1x}"
                    srcset="${entity.thumb.urls._1x} 1x, ${entity.thumb.urls._2x} 2x"
                    width="${entity.thumb.width}"
                    height="${entity.thumb.height}"
                  />
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

page("*", (ctx, next) => {
  ctx.query = qs.parse(ctx.querystring);
  next();
});

page("/", ({ query }) => index({ id: "atlas", ...query }));
page("/:id", ({ params, query }) => index({ ...params, ...query }));
page("/:collectionId/x/:id", ({ params }) => show(params));
page();
