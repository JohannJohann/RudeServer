
* To start redis on local machine :
redis-server /usr/local/etc/redis.conf
or
redis-server --daemonize yes

* To launch server : 
node src/server.js


* To create https cert on localhost : 
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")


* To build : 
npx webpack
!!! Webpack is not used anymore !!!