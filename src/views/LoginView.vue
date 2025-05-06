<template>
  <div class="container">
    <h2 class="text-center text-white">Login</h2>
    <form method="post" action="/users/login" class="main-form mx-auto col-md-8 d-flex flex-column justify-content-center">
      <div class="form-group">
        <label for="username" class="text-white font-weight-bold">Username</label>
        <input id="username" name="username" type="text" class="form-control" placeholder="Username" />
      </div>
      <div class="form-group">
        <label for="password" class="text-white font-weight-bold">Password</label>
        <input id="password" name="password" type="password" class="form-control" placeholder="Password" />
      </div>
      <div class="remember-me">
        <label><input type="checkbox" /></label>
        <span>Remember Me</span>
      </div>
      <div class="button-holder d-flex">
        <input type="submit" class="btn btn-info btn-lg" value="Login" />
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Може да копираш тук стиловете от style-login-register.css */
</style>
