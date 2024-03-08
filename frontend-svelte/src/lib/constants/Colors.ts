export const cluster_colors = (cluster_label) => {
    if(cluster_label === "-1") return "white"
    else {
        return cluster_colors_list[parseInt(cluster_label) % cluster_colors_list.length]
    }
} 
const cluster_colors_list = [
    "#bebada",
    "#80b1d3",
    "#fccde5",
    "#bc80bd",
    "#1f78b4",
    "#e31a1c",
    "#b15928",
    "#8dd3c7",
    "#ffffb3",
    "#fb8072",
    "#fdb462",
    "#5328b1",
    "#4efff7",
  ];

export const metric_colors = Array(100).fill("#8dd3c7");
// export  const metric_colors = [
//     "#8dd3c7",
//     "#ffffb3",
//     "#bebada",
//     "#fb8072",
//     "#80b1d3",
//     "#fdb462",
//     "#b3de69",
//     "#fccde5",
//     "#d9d9d9",
//     "#bc80bd",
//     "#ccebc5",
//     "#ffed6f",
//     "#1f78b4",
//     "#33a02c",
//     "#e31a1c",
//     "#ff7f00",
//     "#6a3d9a",
//     "#b15928",
//     "#a6cee3",
//     "#b2df8a",
//     "#fb9a99",
//     "#fdbf6f",
//     "#cab2d6",
//     "#ffff99",
//     "#2ca02c",
//     "#3b9ab2",
//   ];

// export const optimization_colors = [
//     "#ccebc5",
//     "#cab2d6",
//     "#ffff99",
//     "#2ca02c",
//     "#3b9ab2",
//   ];
export const optimization_opacities = [0.2, 0.8]
export const optimization_colors = ["#f6f6f6", "#dbdbdb"]