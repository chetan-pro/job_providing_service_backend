const { User, UserRoles } = require("../../models");


module.exports = { 

    serviceProvider: async(req, res) => {
        const { search } = req.query
        
        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            offset: offset,
        };
        if (limit) options['limit'] = limit;
        const roletype = 'HSP'
        if(!search){
            User.findAndCountAll({
                attributes: ["id", "name"],
                include: [{
                    model: UserRoles,
                    where: {
                        'roleType': roletype
                    },
                }],
                options,
            })
            .then((data) => {
                if (data.count === 0) {
                    // res.send(data)
                    res.render('admin/serviceProvider/serviceProvider', 
                        { message: 'No Data Found !', data:'', extra: '', pageNo: '', limit: '', search: '' })
                } else {
                    const extra = {
                        per_page : limit,
                        total : data.count,
                        pages : Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/serviceProvider/serviceProvider', {
                        data, message: '', extra, pageNo, limit, search: ''
                    })
                }
            })
            .catch(err => {
                console.log(err)
            })
        } else {
            User.findAndCountAll({
                attributes: ["id", "name"],
                include: [{
                    model: UserRoles,
                    where: {
                        'roleType': roletype
                    },
                }],
                where: {
                    name: {
                        [Op.or]: [
                          { [Op.like]: '%' + search + '%' } ,
                        ]
                    }
                },
                options,
            })
            .then((data) => {
                if (data.count === 0) {
                    // res.send(data)
                    res.render('admin/serviceProvider/serviceProvider', 
                        { message: 'No Data Found !', data:'', extra: '', pageNo: '', limit: '', search })
                } else {
                    const extra = {
                        per_page : limit,
                        total : data.count,
                        pages : Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/serviceProvider/serviceProvider', {
                        data, message: '', extra, pageNo, limit, search
                    })
                }
            })
            .catch(err => {
                console.log(err)
            })
        }
            
    },

    serviceProviderDetails: async(req, res) => {
        const id= req.params.id

        await User.findByPk(id)
            .then((alldata) => {
                res.render('admin/serviceProvider/serviceProviderDetail', {alldata})
            })
            .catch((err) => {
                console.log(err)
            })
    },

    

}