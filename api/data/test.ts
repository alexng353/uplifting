const gae = "[[Occipitalis muscle|occipitalis]]";

const gae2 = "occipitalis";

function clean(str: string) {
  return str.replace(/\[\[(.*?)\|(.*?)\]\]/g, "$2");
}

console.log(clean(gae));
