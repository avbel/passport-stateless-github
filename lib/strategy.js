var util = require("util")
  , Strategy = require("passport").Strategy,
  , url = require("url")
  , request = require("superagent");


var GITHUB  = "https://api.github.com";

function StatelessGithubStrategy(options, verify){
  Strategy.call(this);
  this.options = options || {};
  if(!this.options.clientId){
    this.options.clientId = this.options.clientID;
  }
  if(!this.options.clientId){
    throw new Error("Missing required option 'clientId'");
  }
  if(!this.options.clientSecret){
    throw new Error("Missing required option 'clientSecret'");
  }
  this.verify = verify || this.options.verify;
}

StatelessGithubStrategy.prototype.authenticate = function(req, options) {
  var self = this;
  var authorization = req.headers["authorization"];
  if (!authorization) {
    return this.fail(401);
  }
  var parts = authorization.split(" ");
  var token = parts[parts.length - 1];
  if(!token){
    return this.fail(400);
  }
  var tokenUrl = url.resolve(GITHUB, "/applications/" + this.options.clientId + "/tokens/" + token);
  request.get(tokenUrl).auth(this.options.clientId, this.options.clientSecret).end(function(err, response){
    if(err){
      return self.fail(err);
    }
    if (response.statusCode === 200) {
      if(self.verify){
        self.verify(token, function(err, result){
          if(err){
            return self.fail(err);
          }
          if(result === false){
            return self.fail(403);
          }
          result = result || {};
          result.token = token;
          return self.success(result);
        });
      }
      else{
        return self.success({token: token});
      }
    }
    self.fail(response.statusCode);
  });
};

StatelessGithubStrategy.GITHUB = GITHUB;

util.inherits(StatelessGithubStrategy, Strategy);
module.exports = StatelessGithubStrategy;