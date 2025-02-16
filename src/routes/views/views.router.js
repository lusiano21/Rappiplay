import express  from "express";
import BusinessModel from "../../models/products.js";
import CommunsUtil from "../../utils/utils.views.js";
import { isValidToken } from "../../utils/configBcrypt.js";
//import passport from "passport";
const router = express.Router();

router.get('/', async(req, res)=> {
  const { query: { limit = 5, page = 1, sort} } = req
  const options = {
    limit,
    page,
  }
  if (sort) {
    options.sort = { grade: sort }
  }
  const result = await BusinessModel.paginate({}, options)
  res.send(CommunsUtil.buidResponse({ ...result, sort }))
});
router.get('/create', async(req, res)=> {
  res.render('create',{style:'index.css'})
});
router.get('/register', async(req, res)=> {
  res.render('register',{style:'index.css'})
});
router.get('/reset', async(req, res)=> {
  res.render('reset')
});
router.get('/new-password', async (req, res) => {
  const {query} = req
  if(await isValidToken(query.token)){
    const datos = await isValidToken(query.token)
    res.render('new-password',{payload:datos})
  }else{
    res.send(
      `<div>
       <h1>Esta pagina no esta hablitada</h1>
       <a href="/"> Inicio </a> 
      </div>`
    )
    
  }
  
})
//router.get('/auth/github', passport.authenticate('github', { scope: [ 'user:email' ] }))
export default router;