import User from '../models/users';
import Resume from '../models/resumes';
import Github from '../services/github';

// user login/logout/signup

const login = async (ctx, next) => {
  const { email, pwd } = ctx.request.body;
  const loginResult = await User.login(email, pwd);
  const { message, success, result } = loginResult;
  if (success) {
    ctx.session.userId = result;
  }
  ctx.body = {
    message,
    success
  };
};

const logout = async (ctx, next) => {
  ctx.session.userId = null;
  ctx.session.githubToken = null;
  ctx.session.githubLogin = null;
  ctx.redirect('/');
};

const signup = async (ctx, next) => {
  const { email, pwd } = ctx.request.body;
  const signupResult = await User.createUser(email, pwd);
  const { message, success, result } = loginResult;
  if (success) {
    const { _id, userName, email } = result;
    ctx.session.userId = _id;
    await Resume.initialResume(_id, {
      email,
      name: userName
    });
  }
  ctx.body = {
    message,
    success
  };
};

const loginPage = async (ctx, next) => {
  await ctx.render('user/login', {
    title: 'hacknical | 更加高效的在线简历',
    isMobile: ctx.state.isMobile
  });
};

const githubLogin = async (ctx, next) => {
  const { code } = ctx.request.query;
  const result = await Github.getToken(code);
  try {
    const githubToken = result.match(/^access_token=(\w+)&/)[1];
    console.log('===== user githubToken is =====');
    console.log(githubToken);
    const userInfo = await Github.getUser(githubToken);
    if (userInfo) {
      ctx.session.githubToken = githubToken;
      const githubUser = JSON.parse(userInfo);
      ctx.session.githubLogin = githubUser.login;
      const loginResult = await User.loginWithGithub(githubUser);
      if (loginResult.success) {
        ctx.session.userId = loginResult.result._id;
        return ctx.redirect('/user/dashboard');
      }
    }
    return ctx.redirect('/user/login');
  } catch (TypeError) {
    return ctx.redirect('/user/login');
  }
};

// user dashboard
const dashboard = async (ctx, next) => {
  const { userId, githubLogin } = ctx.session;
  if (ctx.state.isMobile) {
    ctx.redirect(`/github/${githubLogin}`);
  }

  await ctx.render('user/dashboard', {
    title: `hacknical | ${githubLogin} 的个人主页`
  });
};

// user analysis mobile
const mobileAnalysis = async (ctx, next) => {
  await ctx.render('user/mobile/analysis', {
    title: '数据记录',
    user: {
      isAdmin: true
    },
  });
};

const mobileSetting = async (ctx, next) => {
  await ctx.render('user/mobile/setting', {
    title: '数据更新',
    user: {
      isAdmin: true
    },
  });
};

export default {
  // user
  login,
  logout,
  signup,
  loginPage,
  githubLogin,
  // dashboard
  dashboard,
  // mobile
  mobileAnalysis,
  mobileSetting
}
