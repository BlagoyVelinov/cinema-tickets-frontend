const ProjectionFormat = {
  D_2D: { value: "2D" },
  D_3D: { value: "3D" },
  D_4DX: { value: "4DX" },

  getValue(key) {
    return this[key]?.value || null;
  },

  values() {
    return Object.keys(this).filter(key => typeof this[key] === "object");
  }
};

export default ProjectionFormat;