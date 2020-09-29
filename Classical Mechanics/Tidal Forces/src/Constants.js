class Constants {
    static G = 6.6742 * 10**(-11);

    static body = {
        earth : {
            r : 6371 * 10**3,
            m : 6.27 * 10**24
        },
        moon : {
            r : 3474.2 * 10**3,
            m : 7.36 * 10**22,
            d_toEarth : 384400 * 10**3,
            T : 27 * 24 * 60 * 60
        }
    };
}
