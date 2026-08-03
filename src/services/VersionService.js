import AuthService from "./AuthService";

const VersionService = {
  getAll: () => AuthService.get("versions"),
};

export default VersionService;
