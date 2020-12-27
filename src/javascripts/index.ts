import page from "page";
import qs from "qs";
import { index } from "./pages/index";
import { show } from "./pages/show";
import { slides } from "./pages/slides";

page("*", (ctx, next) => {
  ctx.query = qs.parse(ctx.querystring);
  next();
});

page("/", (ctx) => index({ id: "atlas", ...ctx.query }));
page("/:id", (ctx) => index({ ...ctx.params, ...ctx.query }));
page("/slides/:id", (ctx) => slides({ ...ctx.params, ...ctx.query }));
page("/:collectionId/x/:id", (ctx) => show(ctx.params));

page();
