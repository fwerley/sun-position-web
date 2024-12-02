const subjects = (() => {
    const state = {
        pageObservers: []
    }

    const subscribePageObservers = observer => {
        state.pageObservers.push(observer);
    }

    const handlePageChange = pageId => {
        state.pageObservers.forEach(obs => {
            obs(pageId);
        });
    }

    return {
        subscribePageObservers,
        handlePageChange
    }
})();

export default subjects;