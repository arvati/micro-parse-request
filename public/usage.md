# TOC
   - [Request Server Endpoints](#request-server-endpoints)
     - [GET /](#request-server-endpoints-get-)
<a name=""></a>
 
<a name="request-server-endpoints"></a>
# Request Server Endpoints
<a name="request-server-endpoints-get-"></a>
## GET /
returns status code 200.

```js
agent
    .get('/')
    .expect(200)
    .end(function(err, res) {
        if (err) return done(err);
        //console.info(res.text)
        done();
      });
```

