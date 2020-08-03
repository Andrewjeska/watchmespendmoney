import React, { useEffect } from "react"; // Helper to add scripts to our page

var remark_config = {
  host: "localhost", // hostname of remark server, same as REMARK_URL in backend config, e.g. "https://demo.remark42.com"
  site_id: "wmsm",
  components: ["embed"], // optional param; which components to load. default to ["embed"]
  // to load all components define components as ['embed', 'last-comments', 'counter']
  // available component are:
  //     - 'embed': basic comments widget
  //     - 'last-comments': last comments widget, see `Last Comments` section below
  //     - 'counter': counter widget, see `Counter` section below
  //   url: "PAGE_URL", // optional param; if it isn't defined
  // `window.location.origin + window.location.pathname` will be used,
  //
  // Note that if you use query parameters as significant part of url
  // (the one that actually changes content on page)
  // you will have to configure url manually to keep query params, as
  // `window.location.origin + window.location.pathname` doesn't contain query params and
  // hash. For example default url for `https://example/com/example-post?id=1#hash`
  // would be `https://example/com/example-post`.
  //
  // The problem with query params is that they often contain useless params added by
  // various trackers (utm params) and doesn't have defined order, so Remark treats differently
  // all this examples:
  // https://example.com/?postid=1&date=2007-02-11
  // https://example.com/?date=2007-02-11&postid=1
  // https://example.com/?date=2007-02-11&postid=1&utm_source=google
  //
  // If you deal with query parameters make sure you pass only significant part of it
  // in well defined order
  max_shown_comments: 10, // optional param; if it isn't defined default value (15) will be used
  theme: "dark", // optional param; if it isn't defined default value ('light') will be used
  page_title: "Moving to Remark42", // optional param; if it isn't defined `document.title` will be used
  locale: "en", // set up locale and language, if it isn't defined default value ('en') will be used
};

const insertScript = (src: string, id: string, parentElement: HTMLElement) => {
  const script = window.document.createElement("script");
  //   script.async = true;
  script.src = src;
  script.defer = true;
  script.id = id;
  parentElement.appendChild(script);
  return script;
}; // Helper to remove scripts from our page
const removeScript = (id: string, parentElement: HTMLElement) => {
  const script = window.document.getElementById(id);
  if (script) {
    parentElement.removeChild(script);
  }
}; // The actual component

interface RemarkProps {
  id: string;
}

const Remark: React.FC<RemarkProps> = ({ id }) => {
  useEffect(() => {
    // If there's no window there's nothing to do for us
    if (!window) {
      return;
    }
    const document = window.document;
    // In case our #commento container exists we can add our commento script
    if (document.getElementById("commento")) {
      insertScript(
        `${remark_config.host}/web/embed.js`,
        `remark42-script`,
        document.body
      );
    } // Cleanup; remove the script from the page
    return () => removeScript(`remark42-script`, document.body);
  }, [id]);
  return <div id={`remark42`} />;
};
export default Remark;
