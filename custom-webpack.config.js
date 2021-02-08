module.exports = {

  devServer: {

    proxy: {

      '*': {

        bypass: function (req, res, opt) {
          let cookie;
          Object.keys(req.headers).forEach((key) => {
            if (key === 'cookie' && req.headers[key]) {
              const cookieTokens = req.headers[key].split(';');
              cookie = cookieTokens.filter(element => element.includes('vts_WorkshopManagementVTS')).join('');
            }
          });
          if (cookie) {
            let tempCookie = 'vts_token=' + cookie.split('=')[1];
            res.setHeader("Set-Cookie", tempCookie);
          }
        }
      }
    }
  }

};