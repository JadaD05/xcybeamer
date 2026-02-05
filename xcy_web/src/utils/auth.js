export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    return { ...JSON.parse(user), token };
};

export const isAdmin = () => {
    const user = getUser();
    return user && Array.isArray(user.roles) && user.roles.includes('admin');
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
};
