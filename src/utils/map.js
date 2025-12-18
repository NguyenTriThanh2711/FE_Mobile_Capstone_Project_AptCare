export const statusMap = {
  NotStarted: 'scheduled',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
};
export const statusMaintance = (status) =>{
  switch(status){
    case 'Pending': return 'PedingTaskList';
    case 'Completed': return 'CompletedTaskList';
    default: return status;
  }
}