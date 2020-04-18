export const ENDPOINT =
  "https://atlas.auspic.es/graph/a460ff84-66e8-4380-aeab-8c0ff0155ddb";

export const request = ({
  query,
  variables,
}: {
  query: string;
  variables?: any;
}) =>
  fetch(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => res.json());
